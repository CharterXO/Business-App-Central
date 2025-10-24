import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const userHash = await bcrypt.hash('user123', 10);

  await sql`insert into users (username, password_hash, role) values ('admin', ${adminHash}, 'admin')
            on conflict (username) do nothing`;
  await sql`insert into users (username, password_hash, role) values ('user', ${userHash}, 'user')
            on conflict (username) do nothing`;

  await sql`insert into apps (name, login_url, category, icon_url, description) values
    ('Zoho CRM','https://accounts.zoho.com/signin','Sales',null,'CRM'),
    ('Slack','https://slack.com/signin','Communication',null,'Team chat'),
    ('Stripe','https://dashboard.stripe.com/login','Finance',null,'Payments')
    on conflict do nothing`;
}

main().then(()=>{ console.log('Seeded'); process.exit(0); }).catch(e=>{ console.error(e); process.exit(1); });
