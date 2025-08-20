# SELLY Database Schema Discovery Scripts

This directory contains automated scripts to discover and analyze your Supabase database schema for the SELLY RAG implementation.

## 🚀 Quick Start

### Option 1: Simple Discovery (Recommended)
```bash
# Run the simple discovery script
pnpm run discover-schema
```

### Option 2: Advanced Discovery (Requires tsx)
```bash
# Install tsx if not already installed
npm install -g tsx

# Run the advanced discovery script
pnpm run discover-schema-advanced
```

## 📋 What These Scripts Do

### Simple Discovery (`simple-discovery.js`)
- ✅ **No additional dependencies** - Uses only existing packages
- ✅ **Discovers all accessible tables** in your Supabase database
- ✅ **Analyzes column structures** from sample data
- ✅ **Infers relationships** based on naming conventions
- ✅ **Discovers storage buckets** and their configurations
- ✅ **Generates comprehensive reports** in JSON and Markdown formats

### Advanced Discovery (`discover-database-schema.ts`)
- ✅ **Full TypeScript implementation** with type safety
- ✅ **Uses PostgreSQL information_schema** for detailed analysis
- ✅ **Custom SQL functions** for enhanced discovery
- ✅ **More detailed metadata** extraction
- ✅ **Performance analysis** and optimization suggestions

## 📊 Generated Output

Both scripts generate two files in the `docs/` directory:

### 1. `database-inventory.json`
Complete machine-readable inventory including:
```json
{
  "discoveredAt": "2025-01-27T...",
  "tables": {
    "users": {
      "type": "BASE TABLE",
      "columns": {
        "id": {
          "dataType": "uuid",
          "isPrimaryKey": true,
          "isNullable": false
        },
        "name": {
          "dataType": "text",
          "isPrimaryKey": false,
          "isNullable": false
        }
      },
      "primaryKeys": ["id"],
      "foreignKeys": [],
      "sampleData": [...],
      "estimatedRowCount": 1247
    }
  },
  "storage": {
    "buckets": [...]
  },
  "relationships": {
    "users": {
      "referencedBy": ["pengajuan_bulanan"],
      "references": []
    }
  }
}
```

### 2. `database-schema-report.md`
Human-readable report with:
- Summary statistics
- Table descriptions
- Column details with types and constraints
- Relationship mappings
- Primary and foreign key information

## 🔧 Prerequisites

### Environment Variables
Make sure these are set in your `.env.local` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Required Permissions
The service role key needs access to:
- Read from all tables in the `public` schema
- Access to `information_schema` (for advanced discovery)
- Storage bucket listing permissions

## 🛠️ Troubleshooting

### "Missing environment variables"
```bash
# Check if your .env.local file exists and contains:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### "Cannot access table X"
This is normal - the script will skip tables it cannot access and continue with others.

### "Storage access not available"
Storage bucket discovery is optional. The script will continue without it.

### "tsx command not found"
For the advanced script, install tsx:
```bash
npm install -g tsx
# or use the simple discovery script instead
```

## 📈 Next Steps After Discovery

Once you have the schema inventory:

1. **Review the generated reports** in `docs/`
2. **Add Indonesian terminology mappings** for each table and column
3. **Define business rules** and common query patterns
4. **Implement the RAG system** using the discovered schema
5. **Create the vector embeddings** for schema elements

## 🔍 Example Output

After running the discovery, you'll see:
```
🚀 SELLY Simple Database Schema Discovery
==========================================

🔍 Starting simple database schema discovery...
📊 This will analyze your SELLICA database structure

✅ Found 4 accessible tables
📋 Analyzing table: users
📋 Analyzing table: pengajuan_bulanan
📋 Analyzing table: data_rekam
📋 Analyzing table: aktivitas_user
✅ Found 2 storage buckets

✅ Schema discovery completed successfully!
📄 JSON inventory saved to: docs/database-inventory.json
📋 Markdown report saved to: docs/database-schema-report.md

📊 Discovery Summary:
   Tables: 4
   Columns: 23
   Relationships: 3
   Storage Buckets: 2

🎯 Next Steps:
   1. Review the generated reports in the docs/ folder
   2. Add Indonesian terminology mappings
   3. Define business rules and common queries
   4. Proceed with RAG implementation
```

## 🎯 Integration with RAG Implementation

The generated `database-inventory.json` will be used directly in:
- **Schema Knowledge Base** (Week 1-2 of implementation)
- **Vector Embedding System** for semantic search
- **SQL Template Engine** for query generation
- **Entity-Schema Mapping** for Indonesian queries

This automated discovery saves hours of manual work and ensures 100% accuracy of your database schema for the SELLY RAG system!
