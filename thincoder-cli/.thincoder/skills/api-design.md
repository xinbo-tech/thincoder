# api-design — design RESTful APIs

## When to Use
When the user asks to design an API, create endpoints, or define a service contract.

## Design Rules

### URL Structure
- Use nouns, not verbs: `/users` not `/getUsers`
- Plural for collections: `/users`, `/users/123`
- Nested resources max 2 levels: `/users/123/orders` (not `/users/123/orders/456/items`)
- Kebab-case for multi-word: `/user-sessions`

### HTTP Methods
| Method | Purpose | Idempotent |
|--------|---------|------------|
| GET | Read | Yes |
| POST | Create | No |
| PUT | Full replace | Yes |
| PATCH | Partial update | No |
| DELETE | Remove | Yes |

### Status Codes
| Code | When |
|------|------|
| 200 | Success (GET, PUT, PATCH) |
| 201 | Created (POST) |
| 204 | No content (DELETE) |
| 400 | Bad request (validation error) |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict (duplicate, version mismatch) |
| 422 | Unprocessable (semantic error) |
| 429 | Rate limited |
| 500 | Server error |

### Response Format
```json
{
  "data": { ... },           // success
  "error": {                 // failure
    "code": "VALIDATION_ERROR",
    "message": "Human-readable",
    "details": [...]          // optional field-level errors
  },
  "meta": {                  // pagination
    "page": 1, "perPage": 20, "total": 150
  }
}
```

### Query Parameters
- Pagination: `?page=1&perPage=20` (default 20, max 100)
- Sorting: `?sort=-createdAt` (prefix `-` for descending)
- Filtering: `?status=active&role=admin`
- Searching: `?q=search+terms`
- Field selection: `?fields=id,name,email`

### Error Responses
Always include a machine-readable `code` and human-readable `message`:
```json
{ "error": { "code": "INSUFFICIENT_FUNDS", "message": "Account balance too low for this transaction" } }
```

## Delivery
- Define all endpoints in a table: Method, Path, Description, Auth required
- Provide request/response examples for the 3 most important endpoints
- Include any auth scheme (Bearer JWT, API key header, etc.)
