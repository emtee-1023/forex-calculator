# Forex Signal Profit Calculator

A small web app that calculates position size and profit for forex/gold signals.

## What it does

Given entry, stop loss, and take-profit prices, it calculates:

- **Lot size** from account balance and risk %: `lots = riskAmount / (slPips × pipValue)`
- **Profit per TP**: `profit = tpPips × pipValue × lots`
- Spread cost, break-even price, and per-TP return %.

## Run

```sh
python app.py          # http://localhost:8000
```

Or with Docker:

```sh
docker compose up       # http://localhost:3003
```
