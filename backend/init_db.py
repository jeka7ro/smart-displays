import asyncio
from db import init_db, close_db

async def main():
    print("Incepem crearea tabelelor in baza de date...")
    await init_db()
    print("Tabelele au fost create cu succes!")
    await close_db()

if __name__ == "__main__":
    asyncio.run(main())
