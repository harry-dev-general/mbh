-- Migration: Document Add-ons Field Implementation
-- Date: 2025-09-15
-- Description: Records the implementation of the Add-ons field for capturing non-vessel booking items

-- Insert documentation for the Add-ons field implementation
INSERT INTO public.documentation (
    title,
    content,
    category,
    tags,
    created_at,
    updated_at
) VALUES (
    'Airtable Add-ons Field Implementation',
    'Implemented a new "Add-ons" field in the Bookings Dashboard table to capture non-vessel items (lilly pads, fishing rods, etc.) while preserving the existing "Booking Items" → "Booked Boat Type" functionality. The webhook automation script now separates boat SKUs from add-on items, maintaining backward compatibility while providing complete order visibility.',
    'integrations',
    ARRAY['airtable', 'bookings', 'webhook', 'automation', 'add-ons'],
    NOW(),
    NOW()
);

-- Add to system improvements log
INSERT INTO public.system_improvements (
    improvement_type,
    description,
    implementation_date,
    impact,
    created_at
) VALUES (
    'feature',
    'Added Add-ons field to capture non-vessel booking items separately from boat bookings',
    '2025-09-15',
    'Improves order tracking, staff operations, and customer communication by showing all booked items',
    NOW()
);

-- Document the technical implementation details
INSERT INTO public.technical_documentation (
    component,
    description,
    implementation_details,
    files_modified,
    created_at
) VALUES (
    'Airtable Webhook Automation',
    'Enhanced webhook processing to separate boats and add-ons',
    jsonb_build_object(
        'changes', ARRAY[
            'Created logic to classify items as boats vs add-ons',
            'Boat SKUs stored in existing Booking Items field',
            'Add-ons stored in new Add-ons field with formatting',
            'SMS notifications updated to include add-ons',
            'Maintains backward compatibility'
        ],
        'boat_skus', ARRAY[
            '12personbbqboat-hire',
            '4personpolycraft',
            'fullday12personbbqboat'
        ],
        'addon_skus', ARRAY[
            'lillypad',
            'fishingrods',
            'kayak',
            'sup',
            'esky'
        ]
    ),
    ARRAY[
        'airtable-webhook-addons-field.js',
        'airtable-sms-script-with-addons.js',
        'AIRTABLE_ADDONS_FIELD_IMPLEMENTATION_GUIDE.md'
    ],
    NOW()
);
