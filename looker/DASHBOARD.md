# looker/ — "what SMT is seeing" public panels (BigQuery + Looker Studio)

A sanitized, embeddable dashboard so judges (and guests) can see SMT's decision *activity* without
any moat leakage. Two GCP components in one: **BigQuery** (store + query) and **Looker Studio**
(free public embed).

## 1. Sanitized BigQuery view

Land each decision (the same `dashboard_dict` the API serves) into a table, then expose only
moat-safe columns through a view — **no params, no thresholds, no PnL**.

```sql
-- raw landing table (written by the API / a scheduled job)
CREATE TABLE IF NOT EXISTS `smt-bot-2026-v2.smtworld.decisions` (
  ts        TIMESTAMP,
  pair      STRING,
  action    STRING,        -- LONG / SHORT / WAIT
  conf      FLOAT64,       -- conviction 0-1
  risk      INT64,
  drivers   STRING,        -- top driver personas, comma-joined
  source    STRING         -- 'demo' (public) or 'live' (private)
);

-- public-safe view: counts + distributions only, nothing reconstructable into alpha
CREATE OR REPLACE VIEW `smt-bot-2026-v2.smtworld.public_activity` AS
SELECT
  TIMESTAMP_TRUNC(ts, HOUR) AS hour,
  pair,
  action,
  COUNTIF(TRUE)             AS decisions,
  ROUND(AVG(conf), 2)       AS avg_conviction,
  ROUND(AVG(risk))          AS avg_risk
FROM `smt-bot-2026-v2.smtworld.decisions`
GROUP BY hour, pair, action;
```

## 2. Looker Studio embed
1. Looker Studio → **Create → Data source → BigQuery** → `smtworld.public_activity`.
2. Build: decisions-per-pair bar, action mix donut, avg-conviction time series.
3. **Share → Embed report**, "anyone with the link can view" → paste the iframe into the front-end
   (or link from the footer). This is the moat-safe public analytics surface — **never** the
   WEEX Streamlit dashboard (that one shows funds/PnL/versions = alpha).
