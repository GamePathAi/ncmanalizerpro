-- Check enum values for subscription_status
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_status_enum');