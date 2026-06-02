#!/bin/bash
# Clean up intermediate and backup files from deduplication work

set -e

echo "==================================="
echo "Cleaning up intermediate files"
echo "==================================="

# Create archive directory for old files
mkdir -p archive

# Move old backup files (keep only the most recent)
echo ""
echo "📦 Archiving old backup files..."
mv sahabah.csv.backup_20260602 archive/ 2>/dev/null || true
mv sahabah.csv.backup_20260602_133938 archive/ 2>/dev/null || true
mv sahabah.csv.backup_20260602_135732 archive/ 2>/dev/null || true
mv sahabah.csv.backup_20260602_144258 archive/ 2>/dev/null || true
mv sahabah.csv.backup_20260602_161713 archive/ 2>/dev/null || true
# Keep sahabah.csv.backup_20260602_162427 (most recent)

mv relationships.csv.backup_20260602 archive/ 2>/dev/null || true
mv relationships.csv.backup_20260602_144133 archive/ 2>/dev/null || true
# Keep relationships.csv.backup_20260602_144202 (most recent)

# Move intermediate deduplication files
echo "🗑️  Archiving intermediate deduplication files..."
mv deduplication_analysis.json archive/ 2>/dev/null || true
mv deduplication_analysis.txt archive/ 2>/dev/null || true
mv deduplication_report.txt archive/ 2>/dev/null || true
mv sahabah_auto_dedup.csv archive/ 2>/dev/null || true
mv sahabah_reviewed.csv archive/ 2>/dev/null || true
mv relationships_original.csv archive/ 2>/dev/null || true

# Move old merge decision logs (keep only the latest)
echo "📋 Archiving old merge decision logs..."
mv merge_decisions_20260602_144015.json archive/ 2>/dev/null || true
# Keep merge_decisions_20260602_162241.json (most recent)

# Keep sahabah_original.csv and sahabah_with_roles.csv for now
echo ""
echo "✅ Cleanup complete!"
echo ""
echo "==================================="
echo "Files kept in data-pipeline/:"
echo "==================================="
ls -lh *.csv *.json *.txt 2>/dev/null | grep -v "^d" | awk '{printf "  %-40s %6s\n", $9, $5}'
echo ""
echo "==================================="
echo "Files archived in data-pipeline/archive/:"
echo "==================================="
ls -lh archive/ 2>/dev/null | grep -v "^d" | tail -n +2 | awk '{printf "  %-40s %6s\n", $9, $5}'
echo ""
echo "💡 Next steps:"
echo "   1. Apply the new roles field: mv sahabah_with_roles.csv sahabah.csv"
echo "   2. Delete archive/ folder when you're confident: rm -rf archive/"
