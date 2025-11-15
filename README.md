# Arkain API Service

A backend service for managing player information and game interactions with Redis caching and RabbitMQ message queuing.

## Features

- **Player Management**: Retrieve player information with caching
- **Game Play**: Queue game play requests via message queue
- **Performance**: Implements Redis caching for faster data retrieval

## API Endpoints

`GET:- /player/:id`
Retrieves player information by ID with Redis caching.

Parameters:

- `id` (required): Player ID

Responses:

- `200`: Player information
- `500`: Error if required parameters are missing

`POST:- /play`
Queues a game play request.

Parameters:
"playerId": "string",
"gameId": "string",
"betAmount": number,
"winAmount": number

Responses:

- `200`: message: status - queued
- `500`: Error if inputs are not valid/

## Environment Variables :

RABBITMQ_URL: URL for RabbitMQ server
queue: Name of the message queue
MONGO_URL: MongoDB connection details (handled by mongoConnect)

## License

ISC

## Author

Rishitha
