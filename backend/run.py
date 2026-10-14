import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    # Enable reload only in local development unless explicitly requested
    is_dev = os.environ.get("ENVIRONMENT", "development").lower() == "development"
    reload_opt = os.environ.get("RELOAD", str(is_dev)).lower() in ("true", "1")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=reload_opt)
