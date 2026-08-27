Read an image file and return it as multimodal content visible to the model. Use this to view screenshots, UI mockups, diagrams, or any visual content. The model only sees images through this tool — it cannot "see" files directly. Supports png, jpg, gif, webp. The image is base64-encoded and included in the response. Large images (>15MB) are rejected.

Parameters:
- path (required): Path to image file (relative to cwd or absolute). Supports png, jpg, gif, webp; svg is returned as text source.

Notes:
- Raster formats only (png/jpg/gif/webp): no mainstream vision API (Kimi, Anthropic, OpenAI, Gemini) accepts svg or bmp, and an unsupported image part in history makes every subsequent request fail with 400. svg files are returned as text source instead (readable by any model); bmp is rejected — convert to PNG first.
- This tool only works with models that support vision/image input (Kimi K3, Qwen3.8, MiniMax M3, GLM-5.3-Flash). Pure text models (DeepSeek V4, GLM-5) will receive an error — except svg, which needs no vision support since it is read as text.
