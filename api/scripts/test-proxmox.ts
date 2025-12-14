import { config } from 'dotenv';
import axios from 'axios';
import * as https from 'https';
import * as path from 'path';

// Load .env from api directory
config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
    console.log('--- Proxmox Connection Test ---');
    console.log(`URL: ${process.env.PROXMOX_API_URL}`);
    const token = process.env.PROXMOX_API_TOKEN || '';
    console.log(`TOKEN: ${token.substring(0, 15)}...`);

    if (!process.env.PROXMOX_API_URL || !process.env.PROXMOX_API_TOKEN) {
        console.error('ERROR: Missing environment variables!');
        return;
    }

    try {
        const client = axios.create({
            baseURL: process.env.PROXMOX_API_URL,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
            headers: {
                Authorization: `PVEAPIToken=${process.env.PROXMOX_API_TOKEN}`,
            },
            timeout: 5000 // 5 second timeout
        });

        console.log('Attempting to fetch nodes...');
        const res = await client.get('/api2/json/nodes');
        console.log('SUCCESS! Connection established.');
        console.log(`Found ${res.data.data.length} nodes.`);
        console.log('Nodes:', res.data.data.map((n: any) => n.node).join(', '));

        console.log('Attempting to fetch VMs...');
        const vms = await client.get('/api2/json/cluster/resources?type=vm');
        console.log(`Found ${vms.data.data.length} VMs.`);

    } catch (error: any) {
        console.error('\n!!! CONNECTION FAILED !!!');
        console.error(`Message: ${error.message}`);
        if (error.response) {
            console.error(`Status: ${error.response.status} ${error.response.statusText}`);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.code) {
            console.error(`Error Code: ${error.code}`);
        }
    }
}

testConnection();
