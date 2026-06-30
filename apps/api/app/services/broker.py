import os
import asyncio
from typing import Any, List
import json

class MessageBroker:
    async def start(self):
        pass

    async def stop(self):
        pass

    async def publish(self, topic: str, message: dict):
        pass

    async def subscribe(self, topic: str):
        pass


class MemoryBroker(MessageBroker):
    def __init__(self):
        self.queue = asyncio.Queue(maxsize=5000)

    async def start(self):
        pass

    async def stop(self):
        pass

    async def publish(self, topic: str, message: dict):
        try:
            self.queue.put_nowait((topic, message))
        except asyncio.QueueFull:
            pass # Drop silently to prevent OOM

    async def subscribe(self, topic: str) -> Any:
        # A simple pull mechanism. For production, consumer groups would be more complex.
        t, msg = await self.queue.get()
        return msg


class KafkaBroker(MessageBroker):
    def __init__(self):
        from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
        self.producer = AIOKafkaProducer(
            bootstrap_servers='localhost:9092',
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        self.consumer = AIOKafkaConsumer(
            'live_transactions',
            bootstrap_servers='localhost:9092',
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            auto_offset_reset='latest'
        )

    async def start(self):
        await self.producer.start()
        await self.consumer.start()

    async def stop(self):
        await self.producer.stop()
        await self.consumer.stop()

    async def publish(self, topic: str, message: dict):
        # Fire-and-forget batching
        await self.producer.send(topic, message)

    async def subscribe(self, topic: str) -> Any:
        msg = await self.consumer.getone()
        return msg.value


async def get_active_broker() -> MessageBroker:
    if os.getenv("BROKER_MODE") == "memory":
        broker = MemoryBroker()
        await broker.start()
        return broker
    
    # Try socket connection first to prevent aiokafka from endlessly spamming logs
    import socket
    try:
        with socket.create_connection(("localhost", 9092), timeout=2):
            pass
    except (ConnectionRefusedError, socket.timeout, OSError) as e:
        print(f"[WARN] Kafka unavailable on port 9092 ({e}), falling back to MemoryBroker")
        broker = MemoryBroker()
        await broker.start()
        return broker

    # If socket connects, proceed with KafkaBroker
    try:
        broker = KafkaBroker()
        await broker.start()
        print("[SUCCESS] Kafka broker connected")
        return broker
    except Exception as e:
        print(f"[WARN] Kafka startup failed ({e}), falling back to MemoryBroker")
        broker = MemoryBroker()
        await broker.start()
        return broker
