# Pricing review — items for business approval

**No rate, multiplier, fixed price or GST assumption was changed.** `tests/unit/pricing-parity.test.ts` loads the pricing code from the original HTML file and checks the new implementation against it line by line for 5,000 random configurations, every style default and 300 multi-line quotes.

What changed is presentation only: each line now has a category (door & glass, handles/locks/fittings, frame & trim, installation) so customers see where the money goes, and every price is labelled as an estimate.

Please confirm or correct each item below. Rates live in `src/domain/catalog.ts`; bump `PRICING_VERSION` when they change (it is stored with every quote request).

| # | Assumption in the original | Question |
| - | --- | --- |
| 1 | GST at a flat **18%** on the whole estimate, including installation. | Is 18% correct for each product line? Should supply-and-install be treated as one composite supply? Please confirm with your accountant. |
| 2 | "From" prices are the **default configuration**, which includes a sal frame (₹4,600), a lock, and installation (₹1,800, or ₹4,500 for Pivot). | Is that the starting price you want to advertise, or should "from" be shutter-only? |
| 3 | Engineered wood (HDF) is priced **below** hardwood flush board (0.9× vs 1.0×). | Intended? |
| 4 | A pull bar on a Pivot door is a 1400 mm bar at **1.9×** the standard pull price. | Confirm. |
| 5 | Shutter and handle lines are **rounded to the nearest ₹10**; GST to the nearest rupee. | Confirm. |
| 6 | Rate is linear by area: a 1500 × 3000 mm door costs exactly proportionally more than a 600 × 1800 mm door. No oversize surcharge. | Do oversize doors need a surcharge or a cap? |
| 7 | The hardware-finish surcharge (black ₹350, brass ₹700, rose gold ₹600) applies to the handle only, not to the lock or hinges. | Confirm. |
| 8 | Glass price is fixed per door regardless of door height. | Confirm. |
| 9 | Sliding Barn uses the standard ₹1,800 installation; Pivot has its own ₹4,500. | Confirm barn track installation cost. |
| 10 | Architrave is a flat ₹2,600 regardless of size. | Confirm. |
| 11 | Any style can be configured for any room (e.g. Louvred for a main entrance); entrance advice is a suggestion only. | Should some combinations be blocked? |
| 12 | PU paint is described as "any shade", but five colours are offered. | Offer custom shades by request, or change the description? |
| 13 | Customer copy promises a **free** site measurement (carried over from the original). | Confirm the offer and any area limits. |
| 14 | Collections (Entrance, Panelled, Contemporary, Light & air, Space-saving) are a new grouping of the existing nine styles. | Approve names and grouping. |
| 15 | Product stories on `/doors/[slug]` and short notes on each core (e.g. "Dense Indian hardwood") expand the original one-line descriptions. | Approve copy; no new products, materials or prices were introduced. |
| 16 | Brand statements in the new copy, inferred from the original site: doors are **made to order in Hyderabad**, **fitted by Threshold's own team**, and **nothing goes into production before the site measurement**. | Confirm each is true, or tell us what to change. No awards, testimonials, delivery times or warranties are claimed anywhere. |
