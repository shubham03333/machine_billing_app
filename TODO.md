# TODO: Fix Rental Customer Association Issue

## Problem
- When creating a new rental with an existing contact number, the system associates it with the existing customer.
- This causes updates to one rental to affect all rentals linked to the same customer, leading to unintended changes.

## Solution
- Modify the customer creation logic in the POST method of `app/api/rentals/route.ts` to always create a new customer for each rental.
- This ensures each rental is linked to a unique customer, preventing unintended associations.

## Steps
- [x] Update the POST method in `app/api/rentals/route.ts` to remove the find-or-create logic and always create a new customer.
- [x] Test the changes to ensure new customers are created for each rental.
- [x] Verify that updates to one rental do not affect others.
