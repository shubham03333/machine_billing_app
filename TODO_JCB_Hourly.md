# TODO: Implement JCB (Excavator) Hourly Work with Normal and Breaker Types

## Overview
The app already has JCB (excavator) as a machine type. Add support for JCB hourly work with two types: Normal and Breaker. Normal work uses a previously selected hourly rate, while Breaker work has a different hourly rate. Include a button to mark time slots as Breaker, calculate amounts accordingly, and display the total calculated amount. This will be implemented in the existing excavator/JCB rental creation and editing logic.

## Database Updates
- [ ] Add JCB model or extend existing Rental model in Prisma schema to include:
  - normalHourlyRate (decimal)
  - breakerHourlyRate (decimal)
  - timeSlots (array of objects with startTime, endTime, isBreaker boolean, calculatedAmount)
- [ ] Run Prisma migration to update database

## UI Updates for JCB Hourly Work
- [ ] Update Rental interface in page.tsx to include JCB hourly fields
- [ ] Add form fields for normal and breaker hourly rates in add/edit rental forms
- [ ] Add time slot management UI:
  - Input fields for start and end times
  - Button to mark time slot as Breaker
  - Display calculated amount per slot based on type
- [ ] Display total calculated amount for all time slots
- [ ] Update createRental and updateRental functions to handle JCB hourly data

## Calculation Logic
- [ ] Implement function to calculate amount per time slot:
  - If normal: hours * normalHourlyRate
  - If breaker: hours * breakerHourlyRate
- [ ] Implement total amount calculation summing all slot amounts
- [ ] Ensure calculations update in real-time as slots are added/edited

## API Updates
- [ ] Update rental API routes to handle JCB hourly data (create, update, fetch)
- [ ] Add validation for rates and time slots

## Testing
- [ ] Test adding JCB rentals with normal and breaker rates
- [ ] Test adding time slots with Breaker button
- [ ] Test amount calculations for individual slots and total
- [ ] Test editing JCB rentals
- [ ] Verify mobile responsiveness for new UI elements
