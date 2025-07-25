from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database models (simplified - use proper DB in production)
games_db = []
leaderboard_db = []

class GameResult(BaseModel):
    game_type: str
    player_id: str
    player_name: str
    score: int
    duration: int
    winner: bool

class LeaderboardEntry(BaseModel):
    player_name: str
    game_type: str
    high_score: int
    games_played: int
    wins: int

@app.get("/")
async def root():
    return {"message": "Game API Server"}

@app.post("/api/games/result")
async def save_game_result(result: GameResult):
    game_record = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        **result.dict()
    }
    games_db.append(game_record)
    
    # Update leaderboard
    update_leaderboard(result)
    
    return {"message": "Game result saved", "id": game_record["id"]}

@app.get("/api/leaderboard/{game_type}")
async def get_leaderboard(game_type: str):
    game_leaderboard = [
        entry for entry in leaderboard_db 
        if entry["game_type"] == game_type
    ]
    return sorted(game_leaderboard, key=lambda x: x["high_score"], reverse=True)

@app.get("/api/games/history/{player_id}")
async def get_game_history(player_id: str):
    player_games = [
        game for game in games_db 
        if game["player_id"] == player_id
    ]
    return sorted(player_games, key=lambda x: x["timestamp"], reverse=True)

def update_leaderboard(result: GameResult):
    # Find existing entry or create new one
    existing_entry = None
    for entry in leaderboard_db:
        if (entry["player_name"] == result.player_name and 
            entry["game_type"] == result.game_type):
            existing_entry = entry
            break
    
    if existing_entry:
        existing_entry["games_played"] += 1
        existing_entry["high_score"] = max(existing_entry["high_score"], result.score)
        if result.winner:
            existing_entry["wins"] += 1
    else:
        leaderboard_db.append({
            "player_name": result.player_name,
            "game_type": result.game_type,
            "high_score": result.score,
            "games_played": 1,
            "wins": 1 if result.winner else 0
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)