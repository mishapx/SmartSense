const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_BLOB_CONTAINER);

async function saveTelemetry(deviceId, data) {
  const blobName = `${deviceId}/${Date.now()}.json`;
  const client = containerClient.getBlockBlobClient(blobName);
  await client.upload(JSON.stringify(data), Buffer.byteLength(JSON.stringify(data)));
  return blobName;
}

module.exports = { saveTelemetry };
