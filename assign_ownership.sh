#!/bin/bash
# Script to add ownership tags to existing VMs/CTs in Proxmox
# This assigns all existing instances to a specific user


# Configuration
PROXMOX_URL="https://145.239.11.171:8006"
PROXMOX_TOKEN="root@pam!cloud_proxmox=455a6254-a0f7-4e8a-9f88-c745d6b9bd67"
USER_ID="6bfed345-8e73-4fa9-9dab-7e5d133deb02"  # unishadow@etik.com

TAG="owner-${USER_ID}"

echo "=== Proxmox Ownership Tag Script ==="
echo "User ID: ${USER_ID}"
echo "Tag: ${TAG}"
echo ""

# URL encode the tag (needed for special characters)
urlencode() {
    python3 -c "import urllib.parse; print(urllib.parse.quote('$1', safe=''))"
}

# Fetching nodes
echo "Fetching nodes..."
NODES_RESPONSE=$(curl -s -k -H "Authorization: PVEAPIToken=${PROXMOX_TOKEN}" \
    "${PROXMOX_URL}/api2/json/nodes")

NODE_NAMES=$(echo "$NODES_RESPONSE" | grep -oP '"node":"[^"]+"' | sed 's/"node":"//g; s/"//g')

echo "Found nodes: $NODE_NAMES"
echo ""

for NODE in $NODE_NAMES; do
    echo "--- Processing node: $NODE ---"
    
    # Get QEMUs
    QEMU_RESPONSE=$(curl -s -k -H "Authorization: PVEAPIToken=${PROXMOX_TOKEN}" \
        "${PROXMOX_URL}/api2/json/nodes/${NODE}/qemu")
    
    QEMU_VMIDS=$(echo "$QEMU_RESPONSE" | grep -oP '"vmid":\s*[0-9]+' | grep -oP '[0-9]+')
    
    for VMID in $QEMU_VMIDS; do
        # Check if template
        IS_TEMPLATE=$(curl -s -k -H "Authorization: PVEAPIToken=${PROXMOX_TOKEN}" \
            "${PROXMOX_URL}/api2/json/nodes/${NODE}/qemu/${VMID}/config" | grep -oP '"template":\s*1')
        
        if [ -n "$IS_TEMPLATE" ]; then
            echo "QEMU ${VMID}: Skipping template"
            continue
        fi
        
        echo "QEMU ${VMID}: Adding tag..."
        
        # Get current tags
        CONFIG=$(curl -s -k -H "Authorization: PVEAPIToken=${PROXMOX_TOKEN}" \
            "${PROXMOX_URL}/api2/json/nodes/${NODE}/qemu/${VMID}/config")
        
        CURRENT_TAGS=$(echo "$CONFIG" | grep -oP '"tags":"[^"]*"' | sed 's/"tags":"//g; s/"//g')
        
        if echo "$CURRENT_TAGS" | grep -q "$TAG"; then
            echo "  → Tag already exists"
            continue
        fi
        
        # Build new tags - use semicolon as separator (Proxmox standard)
        if [ -n "$CURRENT_TAGS" ]; then
            NEW_TAGS="${CURRENT_TAGS};${TAG}"
        else
            NEW_TAGS="${TAG}"
        fi
        
        # URL encode the entire tags value
        ENCODED_TAGS=$(urlencode "$NEW_TAGS")
        
        # Update using POST with proper Content-Type
        RESULT=$(curl -s -k -X PUT \
            -H "Authorization: PVEAPIToken=${PROXMOX_TOKEN}" \
            -H "Content-Type: application/x-www-form-urlencoded" \
            --data-urlencode "tags=${NEW_TAGS}" \
            "${PROXMOX_URL}/api2/json/nodes/${NODE}/qemu/${VMID}/config")
        
        if echo "$RESULT" | grep -q '"data":null' && ! echo "$RESULT" | grep -q 'error'; then
            echo "  → SUCCESS"
        else
            echo "  → Result: $RESULT"
        fi
    done
    
    # Get LXCs
    LXC_RESPONSE=$(curl -s -k -H "Authorization: PVEAPIToken=${PROXMOX_TOKEN}" \
        "${PROXMOX_URL}/api2/json/nodes/${NODE}/lxc")
    
    LXC_VMIDS=$(echo "$LXC_RESPONSE" | grep -oP '"vmid":\s*[0-9]+' | grep -oP '[0-9]+')
    
    for VMID in $LXC_VMIDS; do
        # Check if template
        IS_TEMPLATE=$(curl -s -k -H "Authorization: PVEAPIToken=${PROXMOX_TOKEN}" \
            "${PROXMOX_URL}/api2/json/nodes/${NODE}/lxc/${VMID}/config" | grep -oP '"template":\s*1')
        
        if [ -n "$IS_TEMPLATE" ]; then
            echo "LXC ${VMID}: Skipping template"
            continue
        fi
        
        echo "LXC ${VMID}: Adding tag..."
        
        # Get current tags
        CONFIG=$(curl -s -k -H "Authorization: PVEAPIToken=${PROXMOX_TOKEN}" \
            "${PROXMOX_URL}/api2/json/nodes/${NODE}/lxc/${VMID}/config")
        
        CURRENT_TAGS=$(echo "$CONFIG" | grep -oP '"tags":"[^"]*"' | sed 's/"tags":"//g; s/"//g')
        
        if echo "$CURRENT_TAGS" | grep -q "$TAG"; then
            echo "  → Tag already exists"
            continue
        fi
        
        if [ -n "$CURRENT_TAGS" ]; then
            NEW_TAGS="${CURRENT_TAGS};${TAG}"
        else
            NEW_TAGS="${TAG}"
        fi
        
        # Update using proper encoding
        RESULT=$(curl -s -k -X PUT \
            -H "Authorization: PVEAPIToken=${PROXMOX_TOKEN}" \
            -H "Content-Type: application/x-www-form-urlencoded" \
            --data-urlencode "tags=${NEW_TAGS}" \
            "${PROXMOX_URL}/api2/json/nodes/${NODE}/lxc/${VMID}/config")
        
        if echo "$RESULT" | grep -q '"data":null' && ! echo "$RESULT" | grep -q 'error'; then
            echo "  → SUCCESS"
        else
            echo "  → Result: $RESULT"
        fi
    done
done

echo ""
echo "=== Done ==="
