#!/bin/sh
echo ""
echo "  Color Swatches is running at:"
echo "  http://localhost:${PORT:-80}"
echo ""
exec nginx -g "daemon off;"
