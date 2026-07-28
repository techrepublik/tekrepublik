import hashlib
import re
import urllib.request
import json
from typing import List
from sqlalchemy.orm import Session

from app.models.content import ContentItem
from app.models.ai import AIRetrievalChunk

OLLAMA_EMBED_URL = "http://ollama:11434/api/embeddings"
EMBED_MODEL = "nomic-embed-text"

def get_embedding(text: str) -> List[float] | None:
    """
    Query the internal Ollama service to retrieve vector embeddings for a given prompt text.
    Returns None if the model is not found, Ollama is starting, or requests fail.
    """
    payload = {
        "model": EMBED_MODEL,
        "prompt": text
    }
    try:
        req = urllib.request.Request(
            OLLAMA_EMBED_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        # Timeout quickly (e.g., 3s) so it doesn't block publishing requests if Ollama is asleep
        with urllib.request.urlopen(req, timeout=3.0) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data.get("embedding")
    except Exception as e:
        # Silently catch so content saving/updating remains fully operational
        print(f"Ollama embedding query failed (expected if model is not loaded yet): {str(e)}")
        return None

def chunk_content_item(db: Session, content_item: ContentItem, body_text: str, version: int):
    """
    Splits the content item body markdown into logical retrieval chunks,
    generates embeddings, and stores them in the ai_retrieval_chunks database table.
    """
    # 1. Clear any existing chunks for this item
    db.query(AIRetrievalChunk).filter(AIRetrievalChunk.content_id == content_item.id).delete()
    
    # 2. Decompose content markdown by headers
    # Split by lines starting with '#', '##', '###', '####'
    sections = []
    current_heading = "Introduction"
    current_lines = []
    
    for line in body_text.split("\n"):
        header_match = re.match(r"^(#{1,4})\s+(.+)$", line)
        if header_match:
            # Save previous section if it has text
            if current_lines:
                sections.append((current_heading, "\n".join(current_lines).strip()))
                current_lines = []
            current_heading = header_match.group(2).strip()
        else:
            current_lines.append(line)
            
    if current_lines:
        sections.append((current_heading, "\n".join(current_lines).strip()))

    # 3. Process each section chunk, ensuring sizes are bounded
    chunk_index = 0
    for heading, text in sections:
        if not text:
            continue
            
        # If the chunk text is extremely long, break it into smaller ~2000 character sub-chunks
        sub_chunks = []
        words = text.split(" ")
        temp_chunk = []
        for word in words:
            temp_chunk.append(word)
            if len(temp_chunk) >= 400:  # ~400 words (~500 tokens)
                sub_chunks.append(" ".join(temp_chunk))
                temp_chunk = []
        if temp_chunk:
            sub_chunks.append(" ".join(temp_chunk))
            
        # 4. Insert each sub-chunk in the DB
        for sub_text in sub_chunks:
            sub_text = sub_text.strip()
            if not sub_text:
                continue
                
            checksum = hashlib.sha256(sub_text.encode("utf-8")).hexdigest()
            token_estimate = len(sub_text) // 4
            
            # Fetch embeddings
            search_vector = get_embedding(sub_text)
            
            db_chunk = AIRetrievalChunk(
                content_id=content_item.id,
                section_heading=heading[:250],
                chunk_index=chunk_index,
                chunk_text=sub_text,
                token_estimate=token_estimate,
                access_level=content_item.access_level,
                content_version=version,
                checksum=checksum,
                search_vector=search_vector
            )
            db.add(db_chunk)
            chunk_index += 1
            
    db.commit()
