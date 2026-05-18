import asyncio
import json
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

import main

class DummyPubSub:
    def __init__(self, messages):
        self.messages = messages
        self.subscribed_channels = []

    async def subscribe(self, channel):
        self.subscribed_channels.append(channel)

    async def listen(self):
        for message in self.messages:
            yield message


class TestAIServiceEventBus(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        main.redis_client = MagicMock()
        main.redis_client.pubsub = MagicMock()
        main.redis_client.publish = AsyncMock()
        main.fetch_real_market_data = AsyncMock(return_value={
            "price": 1.0,
            "market_cap": 100000,
            "volume_24h": 10000,
            "price_change_24h": 0.0,
            "liquidity": 50000,
        })

    async def test_event_bus_listener_subscribes_to_token_detected(self):
        raw_payload = json.dumps({"data": {"tokenMint": "TokenTestMint1234567890abcdef"}})
        pubsub = DummyPubSub([
            {"type": "message", "data": raw_payload}
        ])
        main.redis_client.pubsub.return_value = pubsub

        with patch.object(main, "process_token_detected_event", new=AsyncMock()) as mocked_process:
            await main.event_bus_listener()
            await asyncio.sleep(0)

        self.assertEqual(main.redis_client.pubsub.call_count, 1)
        self.assertEqual(pubsub.subscribed_channels, ["token.detected"])
        mocked_process.assert_awaited_once()

    async def test_process_token_detected_event_publishes_ai_prediction(self):
        payload = {"data": {"tokenMint": "TokenTestMint1234567890abcdef"}}

        await main.process_token_detected_event(payload)

        self.assertEqual(main.redis_client.publish.await_count, 2)
        self.assertEqual(main.redis_client.publish.call_args_list[0][0][0], "ai.prediction")
        self.assertEqual(main.redis_client.publish.call_args_list[1][0][0], "ai.signal")

        published = json.loads(main.redis_client.publish.call_args_list[0][0][1])
        self.assertEqual(published["tokenMint"], "TokenTestMint1234567890abcdef")
        self.assertIn("recommendation", published)
        self.assertIn("score", published)
        self.assertIn("confidence", published)
        self.assertIn("riskLevel", published)

        signal = json.loads(main.redis_client.publish.call_args_list[1][0][1])
        self.assertEqual(signal["type"], "ai-signal")
        self.assertEqual(signal["tokenMint"], "TokenTestMint1234567890abcdef")
        self.assertIn("signalType", signal)
        self.assertIn("confidence", signal)
        self.assertIn("riskLevel", signal)

if __name__ == "__main__":
    unittest.main()
