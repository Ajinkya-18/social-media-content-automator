from io import BytesIO
from docx import Document

def create_docx(content: str) -> BytesIO:
    """
    Creates a DOCX file from the given text content.
    Returns the file as a BytesIO object.
    """
    doc = Document()
    doc.add_paragraph(content)
    
    file_stream = BytesIO()
    doc.save(file_stream)
    file_stream.seek(0)
    return file_stream

def create_markdown(content: str) -> BytesIO:
    """
    Creates a Markdown file (in-memory) from the given text content.
    Returns the file as a BytesIO object.
    """
    file_stream = BytesIO(content.encode('utf-8'))
    file_stream.seek(0)
    return file_stream
