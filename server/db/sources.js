    import "dotenv/config"
    import { pool } from "./db.js"
    import { TRUSTED_SET, DISINFO_SET } from "../config/domain.js"

    async function run() {
    for (const domain of TRUSTED_SET) {
        await pool.execute(
        `INSERT INTO sources (domain_name, tier, is_trusted, last_updated)
        VALUES (?, 'trusted', 1, NOW())
        ON DUPLICATE KEY UPDATE tier='trusted', is_trusted=1, last_updated=NOW()`,
        [domain]
        );
    }

    for (const domain of DISINFO_SET) {
        await pool.execute(
        `INSERT INTO sources (domain_name, tier, is_trusted, last_updated)
        VALUES (?, 'disinfo', 0, NOW())
        ON DUPLICATE KEY UPDATE tier='disinfo', is_trusted=0, last_updated=NOW()`,
        [domain]
        );
    }

    console.log("Seeded sources.");
    process.exit(0);
    }

    run().catch(e => { console.error(e); process.exit(1); });