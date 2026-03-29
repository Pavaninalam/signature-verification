import sqlite3
conn = sqlite3.connect('db.sqlite3')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
print('Tables:', [r[0] for r in c.fetchall()])
c.execute("SELECT loginid, password, status FROM user_registrations")
print('Users:')
for row in c.fetchall():
    print(f"  loginid={row[0]}  password={row[1]}  status={row[2]}")
conn.close()
