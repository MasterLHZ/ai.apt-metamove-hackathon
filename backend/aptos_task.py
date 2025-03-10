#!/usr/bin/env python3
import asyncio
import json
import time
import datetime
import requests
from aptos_sdk.account import Account
from aptos_sdk.async_client import RestClient
from aptos_sdk.transactions import EntryFunction, TransactionArgument, TransactionPayload, Serializer
from dotenv import load_dotenv
import os


load_dotenv()

class PredictionPoolManager:
    def __init__(self, node_url, admin_private_key, contract_address):
        self.client = RestClient(node_url)
        self.admin_account = Account.load_key(admin_private_key)
        self.admin_address = str(self.admin_account.address())
        self.contract_address = contract_address
        self.pool_id_counter = 3
        print(f"admin_address: {self.admin_address}")
        print(f"contract_address: {self.contract_address}")
    
    async def initialize_contract(self, fee_address, fee_rate):
        print("initialize_contract...")
        
        try:
            payload = EntryFunction.natural(
                f"{self.contract_address}::prediction_pool",
                "initialize",
                [],
                [
                    TransactionArgument(fee_address, Serializer.address),
                    TransactionArgument(fee_rate, Serializer.u64)
                ]
            )
            
            signed_tx = self.client.create_bcs_signed_transaction(
                self.admin_account, 
                TransactionPayload(payload)
            )
            
            tx_hash = await self.client.submit_bcs_transaction(signed_tx)
            await self.client.wait_for_transaction(tx_hash)
            
            print(f"initialize_contract success! hash: {tx_hash}")
            return tx_hash
        except Exception as e:
            print(f"initialize_contract failed: {e}")
            raise e
    
    async def create_prediction_pool(self, pool_data):
        print(f"create_prediction_pool {pool_data['asset_type']}...")
        
        target_price = int(float(pool_data["end_price"]) * 100)  # 目标价格以分为单位
        print(f"create_prediction_pool {target_price}")
        
        try:
            payload = EntryFunction.natural(
                f"{self.contract_address}::PredictionPool",
                "create_pool",
                [],
                [
                    TransactionArgument(pool_data["asset_type"].encode(), Serializer.to_bytes),
                    TransactionArgument(pool_data["start_time"], Serializer.u64),
                    TransactionArgument(pool_data["bet_duration"], Serializer.u64),
                    TransactionArgument(pool_data["lock_duration"], Serializer.u64),
                    TransactionArgument(target_price, Serializer.u64),
                    TransactionArgument(pool_data["title"].encode(), Serializer.to_bytes),
                    TransactionArgument(pool_data["optionA"].encode(), Serializer.to_bytes),
                    TransactionArgument(pool_data["optionB"].encode(), Serializer.to_bytes),
                    TransactionArgument(pool_data["reason"].encode(), Serializer.to_bytes)
                ]
            )
            
            signed_tx = await self.client.create_bcs_signed_transaction(
                self.admin_account, 
                TransactionPayload(payload)
            )
            
            tx_hash = await self.client.submit_bcs_transaction(signed_tx)
            await self.client.wait_for_transaction(tx_hash)
            
            print(f"create_prediction_pool success! hash: {tx_hash}")
            
            self.pool_id_counter += 1
            
            return {
                "tx_hash": tx_hash,
                "success": True
            }
        except Exception as e:
            print(f"create_prediction_pool failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }


    async def update_pool_status(self, pool_id):
        print(f"update_pool_status {pool_id} ...")
        
        try:
            payload = EntryFunction.natural(
                f"{self.contract_address}::prediction_pool",
                "update_pool_status",
                [],
                [
                    TransactionArgument(pool_id, Serializer.u64)
                ]
            )
            
            signed_tx = self.client.create_bcs_signed_transaction(
                self.admin_account, 
                TransactionPayload(payload)
            )
            
            tx_hash = await self.client.submit_bcs_transaction(signed_tx)
            await self.client.wait_for_transaction(tx_hash)
            
            print(f"{pool_id} poll status updated! hash: {tx_hash}")
            return tx_hash
        except Exception as e:
            print(f"update_pool_status failed: {e}")
            raise e
    
    async def settle_pool(self, pool_id):
        print(f"settle_pool {pool_id}...")
        
        try:
            payload = EntryFunction.natural(
                f"{self.contract_address}::prediction_pool",
                "settle_pool",
                [],
                [
                    TransactionArgument(pool_id, Serializer.u64)
                ]
            )
            
            signed_tx = self.client.create_bcs_signed_transaction(
                self.admin_account, 
                TransactionPayload(payload)
            )
            
            tx_hash = await self.client.submit_bcs_transaction(signed_tx)
            await self.client.wait_for_transaction(tx_hash)
            
            print(f" {pool_id} settle_pool! hash: {tx_hash}")
            return tx_hash
        except Exception as e:
            print(f"settle_pool failed: {e}")
            raise e
    
    async def get_pool_info(self, pool_id):
        try:
            result = await self.client.view_function(
                self.contract_address,
                "prediction_pool",
                "get_pool_info",
                [self.admin_address, str(pool_id)]
            )
            
            pool_info = {
                "asset_type": result[0],
                "start_time": result[1], 
                "lock_time": result[2],
                "end_time": result[3],
                "status": result[4],
                "target_price": result[5] / 100000000,
                "final_price": result[6] / 100000000,
                "option_a_amount": result[7],
                "option_b_amount": result[8],
                "title": result[9],
                "option_a": result[10],
                "option_b": result[11],
                "close_time": result[12],
                "reason": result[13],
                "creator": result[14],
                "created_at": result[15],
                "winning_option": result[16],
                "is_settled": result[17],
                "fees_collected": result[18]
            }
            
            status_map = {
                0: "Pending",
                1: "Active",
                2: "Locked",
                3: "Settled"
            }
            pool_info["status_text"] = status_map.get(pool_info["status"], "Unknown")
            
            winning_map = {
                0: "No winner yet",
                1: "Option A",
                2: "Option B"
            }
            pool_info["winning_option_text"] = winning_map.get(pool_info["winning_option"], "Unknown")
            
            return pool_info
        except Exception as e:
            print(f"get_pool_info failed: {e}")
            raise e
    
    async def monitor_and_update_pools(self):
        try:
            active_pools = await self.get_active_pools()
            print(f"active_pools number: {len(active_pools)}")
            
        except Exception as e:
            print(f"monitor_and_update_pools failed: {e}")
    
    async def get_active_pools(self):
        try:
            print(f"admin_address: {self.admin_address}")
            print(f"contract_address: {self.contract_address}")
            result = await self.client.view_bcs_payload(
                f"{self.contract_address}::PredictionPool",
                "get_active_pools",
                [],
                [self.admin_address]
            )
            return result[0]
        except Exception as e:
            print(f"get_active_pools failed: {e}")
            return []

async def main():
    NODE_URL = os.getenv("NODE_URL")
    ADMIN_PRIVATE_KEY = os.getenv("ADMIN_PRIVATE_KEY")
    CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
    
    manager = PredictionPoolManager(NODE_URL, ADMIN_PRIVATE_KEY, CONTRACT_ADDRESS)
    
    sample_pools = [
        {
            "asset_type": "BTC/USD",
            "start_time": 1741346490,
            "bet_duration": 7200,
            "lock_duration": 900,
            "end_price": 98000.20,
            "title": "Will BTC exceed $98000.20 in the next hour?", 
            "optionA": "Yes, BTC will exceed $98000.20",
            "optionB": "No, BTC will stay at or below $98000.20",
            "reason": "Bitcoin has been testing the $60,000 resistance level..."
        }
    ]
    
    for pool_data in sample_pools:
        result = await manager.create_prediction_pool(pool_data)
        if result["success"]:
            print(f"create_prediction_pool success, ID: {result['tx_hash']}")
    
    # while True:
    #     await manager.monitor_and_update_pools()
    #     print("waiting 30 seconds...")
    #     await asyncio.sleep(30)

if __name__ == "__main__":
    asyncio.run(main())

