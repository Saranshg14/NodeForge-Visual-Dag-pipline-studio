# VectorShift Technical Assessment

This repository contains the frontend and backend for the VectorShift technical assessment.

## Project Structure

- `frontend/frontend/`: Contains the React frontend application.
- `backend/backend/`: Contains the FastAPI backend application.

## Run Instructions

### 1. Backend Setup

The backend is built with FastAPI. It requires Python 3.7+ installed on your machine.

1. Navigate to the backend directory:
   ```bash
   cd "backend/backend"
   ```
2. (Optional but recommended) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install fastapi uvicorn pydantic
   ```
   *(Note: The main required packages are `fastapi` and `uvicorn`. Ensure they are installed.)*
4. Run the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend will be running at `http://localhost:8000`.

### 2. Frontend Setup

The frontend is built with React. It requires Node.js installed on your machine.

1. Navigate to the frontend directory:
   ```bash
   cd "frontend/frontend"
   ```
2. Install the necessary node modules:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   The frontend will automatically open and run at `http://localhost:3000`.

## Notes on Zipping

To keep the project lightweight when zipping:
- `node_modules/` in the frontend directory have been deleted. You can recreate them anytime by running `npm install` inside the frontend directory.
- `__pycache__/` in the backend directory has been deleted.
