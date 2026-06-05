#!/usr/bin/env python3
# Reference copy of the Cal.rs booking pusher that runs ON nexus-niko.
# Cal.rs (book.ovae.ai) has no HTTP API and stores bookings in SQLite, so this
# read-only script dumps bookings and POSTs them to the sync-bookings edge function.
#
# Deployed at: nexus-niko:/opt/ovae-calrs-sync/push-bookings.py  (root, chmod 700)
# Token at:    nexus-niko:/opt/ovae-calrs-sync/token             (ADMIN_TOKEN, chmod 600, NOT in git)
# Cron:        /etc/cron.d/ovae-calrs-sync  ->  */15 * * * *
#
# To update: edit here, then copy to the server and chmod 700.
import sqlite3, json, urllib.request, urllib.error

DB = "/var/lib/docker/volumes/ovae-calrs_calrs-data/_data/calrs.db"
URL = "https://muguotipixphthfxjssu.supabase.co/functions/v1/sync-bookings"
TOKEN = open("/opt/ovae-calrs-sync/token").read().strip()

con = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
con.row_factory = sqlite3.Row
rows = con.execute(
    """SELECT b.uid, b.guest_name, b.guest_email, b.start_at, b.end_at, b.status, b.notes, et.title
       FROM bookings b LEFT JOIN event_types et ON et.id = b.event_type_id"""
).fetchall()

data = json.dumps({"bookings": [dict(r) for r in rows]}).encode()
req = urllib.request.Request(URL, data=data, headers={"content-type": "application/json", "x-admin-token": TOKEN})
try:
    print(urllib.request.urlopen(req, timeout=30).read().decode())
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read().decode())
