# Test Suite for Story Generation

This test suite ensures that Supabase database updates work correctly for both successful and failed DeepWriter `generateWork` calls.

## Test Files

### `generate-supabase-updates.test.ts`
Comprehensive integration tests that verify Supabase database updates during story generation.

#### Test Coverage:

**✅ Successful Story Generation**
- Story creation with initial `generating` status
- Story update with DeepWriter job ID after successful generation
- Credit consumption after successful generation
- Metadata storage including generation config and job details

**✅ Failed Story Generation**  
- Story status updated to `failed` when DeepWriter API fails
- Error messages properly stored in database
- Credits NOT consumed on generation failures
- Proper handling of missing/empty job IDs

**✅ Database Update Validation**
- Job ID format validation (UUID, string formats)
- Generation metadata structure validation
- Credit calculation logic validation
- Database operation sequencing

**✅ Error Handling Scenarios**
- DeepWriter API error status codes (400, 401, 403, 429, 500)
- Proper error message mapping for user feedback
- Graceful degradation on API failures

## Test Architecture

### Key Test Scenarios Verified:

1. **Success Flow**:
   ```
   Create Story → Call DeepWriter API → Receive Job ID → Update Story → Consume Credits
   ```

2. **Failure Flow**:
   ```
   Create Story → Call DeepWriter API → API Fails → Update Story Status to Failed → Preserve Credits
   ```

3. **Validation Checks**:
   - Valid job ID formats: `123e4567-e89b-12d3-a456-426614174000`
   - Invalid job IDs: `null`, `undefined`, `""`, `" "`
   - Metadata structure validation
   - Credit boundary testing

## Running Tests

```bash
# Run all tests
bun run test

# Run specific test file
bun run test generate-supabase-updates.test.ts

# Run tests in watch mode
bun run test:watch
```

## Mock Strategy

The tests use simplified mocks that focus on the database interaction patterns rather than complex API mocking. This ensures:

- **Reliability**: Tests don't depend on external APIs
- **Speed**: Fast execution without network calls  
- **Focus**: Tests specifically verify database update logic
- **Maintainability**: Simple mocks are easier to maintain

## Test Validation

Each test verifies:
1. **Database State Changes**: Story status, job IDs, metadata
2. **Credit Management**: Proper consumption/preservation
3. **Error Handling**: Correct error states and messages
4. **Data Integrity**: Valid formats and relationships

## Integration with CI/CD

These tests should be run:
- ✅ Before merging PRs
- ✅ On deployment pipelines  
- ✅ During development with watch mode
- ✅ As part of regression testing

The test suite provides confidence that the story generation system properly handles both success and failure scenarios while maintaining database integrity.