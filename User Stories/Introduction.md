# Liqwik

Liqwik is an application with 3 types of users:

1. Asset Seller (A)
2. Asset Buyer (B)
3. Bill-to Party (C)

An *Asset Seller* (**A**) has delivered a good or service to a *Bill-to Party* (**C**) and has raised an invoice for the realizable value. According to the terms of contract between the **A** and **C**, **C** will pay the invoiced amount (Accounts Receivable, **AR**) only after a certain number of days. But **A** wants money immediately for her working capital needs. So **A** solicits bids from *Asset Buyers* (**B**) to transfer a discounted amount (of **AR**) to **A** immediately and receive the full **AR** amount from **C** on the payment due date.

### Workflow

1. **A** creates a new asset on the platform by adding the following details
   1. Bill-to party
   2. Invoiced amount
   3. Payment due date
   4. Max acceptable discount rate
   5. Scanned image of invoice
2. **A** subscribes to Liqwik tokens (denominated at 1000USD each) by paying a fraction to the platform, say 1%. Number of tokens subscribed to will be equal to the rounded down value of **AR / 1000**. (Can s/he also subscribe to a number less than allowed number of tokens?)
3. Platform alerts Bill-to party **C** with a link to an approval page. **C** logs into the platform and approves the asset.
4. **A** launches the subscribed number of tokens for bidding. It will be made visible the 'Live auctions' page.
5. An *Asset Buyer* **B** selects a particular asset and s/he can place bids for any number of tokens (but less than or equal to the number of subscribed tokens for that asset). **B** places a bid by entering the discount rate.
6. **A** views the list of bids for his assets accepts winning bids (how is this done?)
7. On acceptance of bids by **A**, money (equivalent to the number of subscribed tokens - discounted amount) is transferred from **B** to **A**
8. On payment due date, the platform manages the transfer of money from **C** to **B** in proportion to the number of tokens bought.

### Asset States

1. Draft (grey)
2. Bill-to party approval pending (grey)
3. Approved (blue)
4. Bidding active (green)
5. Withdrawn (grey with trash icon)
6. Bidding concluded (yellow)
7. Bids accepted (gold)
8. Matured (disabled gold)
