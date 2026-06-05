# Security Specifications & Rules Verification Specification

Active security design and Attribute-Based Access Control (ABAC) principles for School Master (سكول ماستر) live deployment.

## 1. Data Invariants & Zero Trust Constraints
- **Role Verification**: Users can only perform admin functions if they are verified. Users cannot self-upgrade their roles. New accounts default to their requested roles and are validated manually or approved based on strict credentials.
- **Student Association**: Parents can only view, read, or track academic and financial records for students linked to their parentId.
- **Relational Integrity**: Deletion or changes to student records synchronously updates fee tables, preventing dangling unlinked finance records.
- **Unbounded Arrays Guard**: Messages and conversations are structured such that array sizes of incoming records are limited and safe.

## 2. The Dirty Dozen Payload Attacks (Negative Test Suite)
1. **Admin Role Promotion Bypass**: A user tries to write a UserProfile document claiming role: "admin" directly to bypass approval steps. *Result: PERMISSION_DENIED*
2. **Kid Hijacking**: A parent attempts to read details of a Student whose parentId does not match their uid. *Result: PERMISSION_DENIED*
3. **Ghost Fee Forgiveness**: A parent attempts to update their own student's `FeeLedger` due amount to 0. *Result: PERMISSION_DENIED*
4. **Impersonated Complaint Filing**: An unauthenticated user or parent attempts to file a complaint under a different parentId. *Result: PERMISSION_DENIED*
5. **Unauthorized Complaint Resolution**: A parent attempts to update a complaint status to "solved" directly, bypassing administrative triage. *Result: PERMISSION_DENIED*
6. **Chat Spoofing**: A user tries to push a message into a conversation they are not a participant of. *Result: PERMISSION_DENIED*
7. **Junk ID Poisoning**: A user attempts to create a student with a document ID containing special characters or exceeding 128 characters. *Result: PERMISSION_DENIED*
8. **Client Query Extrapolation**: An authenticated parent attempts to query the list of ALL users in the school without applying where filters. *Result: PERMISSION_DENIED*
9. **Creation Timestamp spoofing**: A user tries to submit an arbitrary `createdAt` timestamp from the client device instead of using `request.time`. *Result: PERMISSION_DENIED*
10. **Admin Privilege Escalation via User Profile update**: An approved, authenticated teacher attempts to change their profile's email to match an existing administrator. *Result: PERMISSION_DENIED*
11. **Direct Fee Payment Verification bypass**: A parent attempts to update a PaymentItem's `verified` key to `true` while loading a bank transference voucher. *Result: PERMISSION_DENIED*
12. **Mass Notification Forgery**: A parent attempts to insert an announcement into the notifications collection. *Result: PERMISSION_DENIED*
