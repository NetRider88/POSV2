# API Simulator - Integrator Guide

## Overview

The API Simulator is a sandbox environment designed to help you test and validate your integration payloads before going live. It provides real-time validation feedback with detailed error messages and fix suggestions.

## How It Works

1. **Get Your Unique Endpoint**: When you open the simulator, you'll receive a unique endpoint URL tied to your browser session
2. **Send Test Requests**: POST your payloads to this endpoint
3. **Get Instant Feedback**: See validation results immediately with detailed error information

## What You'll See

### ✅ Successful Validation

When your payload is valid, you'll see:
- Green success indicator
- Confirmation of the request type (Menu Push or Order Payload)
- Full request details (headers and body)

### ❌ Validation Errors

When validation fails, you'll get detailed information for each error:

#### Error Information Includes:

1. **Field Path**: The exact location of the error in your payload
   - Example: `items.TALABAT_NEW_MENU.images.RESTAURANT_IMAGE`

2. **Error Message**: Clear description of what went wrong
   - Example: "Expected string, received object"

3. **Received Value**: What you actually sent
   - Shows the actual value that caused the error

4. **Expected Format**: What the API expects
   - Example: "object with {id: string, type: string}"

5. **Fix Suggestion**: Actionable guidance on how to fix the issue
   - Example: "Change the value to an object with 'id' and 'type' fields. Example: {\"id\": \"image_123\", \"type\": \"Image\"}"

6. **Error Code**: A unique code for programmatic error handling
   - Example: `INVALID_IMAGE_URL`

## Example Error Display

```
⚠️ Field: items.TALABAT_NEW_MENU.images.RESTAURANT_IMAGE
   Error: Expected string, received object
   Received: {"id": "img_001", "type": "Image"}
   Expected: object with {id: string, type: string}
   
💡 How to fix: Change the value to an object with 'id' and 'type' fields. 
   Example: {"id": "image_123", "type": "Image"}
   
   Error Code: INVALID_IMAGE_URL
```

## Supported Request Types

### 1. Menu Push
Identified by the presence of an `items` key in the payload.

**Common Validations:**
- Menu must have a valid `menuType` (DELIVERY, DINE_IN, or PICK_UP)
- Title must include a `default` translation
- Products must contain at least one item
- Images must be references with `id` and `type` fields

### 2. Order Payload
Identified by the presence of an `orderId` key in the payload.

**Common Validations:**
- Order must have a valid `orderId`
- Customer details (name and phone) are required
- Items array must contain at least one item
- Currency must be a 3-letter code (e.g., AED, USD)
- Prices and quantities must be positive numbers

## Best Practices

1. **Test Early**: Use the simulator during development, not just before launch
2. **Test All Scenarios**: Try valid and invalid payloads to understand the validation rules
3. **Read Fix Suggestions**: The suggestions provide specific examples and guidance
4. **Check Error Codes**: Use error codes for programmatic error handling in your application
5. **Keep Logs**: The simulator maintains a log of all requests during your session

## Common Errors and Solutions

### Type Mismatches
**Error**: "Expected string, received object"
**Solution**: Check if you're sending the correct data type for the field

### Missing Required Fields
**Error**: "This field is required"
**Solution**: Add the missing field to your payload

### Invalid References
**Error**: "Expected object with {id: string, type: string}"
**Solution**: Ensure reference fields include both `id` and `type` properties

### Invalid Enums
**Error**: "Invalid menuType"
**Solution**: Use only the allowed values (DELIVERY, DINE_IN, PICK_UP)

## Need Help?

If you encounter validation errors you don't understand:
1. Check the fix suggestion provided with the error
2. Review the expected format shown in the error details
3. Compare your payload structure with the examples
4. Consult the full API documentation

## Session Management

- Your endpoint URL is unique to your browser session
- Logs are cleared when you refresh the page or clear them manually
- Use the "Clear Logs" button to reset your testing session

---

**Happy Testing! 🚀**
