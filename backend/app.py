from multiversx_sdk import *
from multiversx_sdk.abi import *
from pathlib import Path
from flask import Flask, jsonify, request, Response
from flask_cors import CORS, cross_origin
from io import BytesIO
import struct
from enum import Enum
import hashlib

API_URL = "https://devnet-api.multiversx.com"
PEM_PATH = "../../new_wallet.pem"
CONTRACT_ADDRESS = "erd1qqqqqqqqqqqqqpgqrqz7r8yl5dav2z0fgnn302l2w7xynygruvaq76m26j"
NFT_PICTURE = "https://upload.wikimedia.org/wikipedia/ro/e/e0/Stema_fc_corvinul_hunedoara.png"

pem = UserPEM.from_file(Path(PEM_PATH))
address = pem.public_key.to_address("erd")

app = Flask(__name__)
CORS(app)

get_card_history = []
create_collection_history = []
issue_nft_history = []
exchange_history = []

class Class(Enum):
    Warrior = 0
    Mage = 1
    Rogue = 2
    Priest = 3
    Hunter = 4
    Warlock = 5
    Shaman = 6
    Druid = 7
    Paladin = 8

class Rarity(Enum):
    Common = 0
    Rare = 1
    Epic = 2
    Legendary = 3

class Power(Enum):
    Low = 0
    Medium = 1
    High = 2

class Card:
    def __init__(self, attributes):
        self._class = Class(attributes[0])
        self.rarity = Rarity(attributes[1])
        self.power = Power(attributes[2])
    def to_dict(self):
        return {"Class": self._class.name, "Rarity": self.rarity.name, "Power": self.power.name}


# Helper function to read a length-prefixed buffer
def read_buffer(stream):
    length, = struct.unpack(">I", stream.read(4))  # Read the length as a 4-byte unsigned integer
    return stream.read(length)

# Helper function to read a BigUint (variable-length integer)
def read_biguint(stream):
    length, = struct.unpack(">I", stream.read(4))  # Read the length of the BigUint
    return int.from_bytes(stream.read(length), "big")  # Read and convert to integer

# Parse the EsdtTokenData structure
def parse_esdt_token_data(raw_bytes, full = False):

    stream = BytesIO(raw_bytes)
    
    # Token type (EsdtTokenType / u8)
    token_type, = struct.unpack(">B", stream.read(1))
    
    # Amount (BigUint)
    amount = read_biguint(stream)
    
    # Frozen (1 byte)
    frozen, = struct.unpack(">?", stream.read(1))  # Read as boolean
    
    # Hash (ManagedBuffer)
    token_hash = read_buffer(stream)
    
    # Name (ManagedBuffer)
    name = read_buffer(stream).decode("utf-8")
    
    # Attributes (ManagedBuffer)
    attributes = read_buffer(stream)
    
    # Creator (ManagedAddress, 32 bytes)
    creator = stream.read(32)
    
    # Royalties (BigUint)
    royalties = read_biguint(stream)
    
    # URIs (ManagedVec of ManagedBuffer)
    uri_count, = struct.unpack(">I", stream.read(4))  # Number of URIs
    uris = [read_buffer(stream).decode() for _ in range(uri_count)]
    
    if full:
        return {
            "token_type": "NFT" if token_type == 1 else "Unknown",
            "amount": amount,
            "frozen": frozen,
            "token_hash": token_hash.hex(),
            "name": name,
            "attributes": Card(attributes).to_dict(),
            "creator": Address.from_hex(creator.hex(), "erd").to_bech32(),
            "royalties": royalties,
            "uris": uris
        }
    # Return parsed data
    return {
        "name": name,
        "attributes": Card(attributes).to_dict()
    }

def send_transaction_sync(tx):
    provider = ApiNetworkProvider(API_URL)
    address_on_network = provider.get_account(address)
    signer = UserSigner.from_pem_file(Path(PEM_PATH))
    transaction_computer = TransactionComputer()

    tx.nonce = address_on_network.nonce
    tx.signature = signer.sign(transaction_computer.compute_bytes_for_signing(tx))

    tx_hash = provider.send_transaction(tx)
    print(f'Tx hash: {tx_hash}')
    while True:
        try:
            result = provider.get_transaction_status(tx_hash)
            break
        except:
            pass
    while result.is_pending():
        result = provider.get_transaction_status(tx_hash)

    if result.is_successful():
        tx_details = provider.get_transaction(tx_hash)
        return tx_details
    return None

def call_contract(function_name, arguments, tokens = []):
    contract_address = Address.from_bech32(CONTRACT_ADDRESS)
    config = TransactionsFactoryConfig(chain_id="D")
    provider = ApiNetworkProvider(API_URL)
    factory = SmartContractTransactionsFactory(config=provider.get_network_config())
    tx = factory.create_transaction_for_execute(
        sender=address,
        contract=contract_address,
        function=function_name,
        gas_limit=20000000,
        arguments=arguments,
        token_transfers=tokens
    )

    result = send_transaction_sync(tx)
    
    return result.contract_results.items

def query_contract(function, arguments = []):
    query_runner = QueryRunnerAdapter(ProxyNetworkProvider(API_URL))
    query_controller = SmartContractQueriesController(query_runner)

    data = query_controller.query(
        contract=CONTRACT_ADDRESS,
        function=function,
        arguments=arguments
    )  

    return data

@app.route("/getYourNftCardProperties")
def getYourNftCardProperties():
    try:
        result = call_contract("getYourNftCardProperties", [])
        attributes = bytes.fromhex(result[0].data.split("@")[2])
        student_card = Card(attributes)

        nonce = -1
        result = query_contract("nftSupply", [])
        nfts = list(map(parse_esdt_token_data, result))
        for i, card in enumerate(nfts):
            if card['attributes']['Class'] == student_card._class.name and \
               card['attributes']['Rarity'] == student_card.rarity.name and \
               card['attributes']['Power'] == student_card.power.name:
                nonce = i + 1

        response_dict = student_card.to_dict()
        response_dict.update({"matchingNonce": nonce})
        get_card_history.append({\
            "sender": address.bech32(), \
            "class": response_dict["Class"], \
            "power": response_dict["Power"], \
            "rarity": response_dict["Rarity"] \
        })
        return jsonify(response_dict), 200
    except Exception as e:
        return jsonify({"err": str(e)}), 500

@app.route("/getAssignedCard")
def getAssignedCard():
    result = query_contract("studentsCards", [address])
    student_card = Card(result[0])
    return jsonify(student_card.to_dict()), 200

@app.route("/findMatchingNft")
def findMatchingNft():
    result = query_contract("studentsCards", [address])

    student_card = Card(result[0])
    nonce = -1
    result = query_contract("nftSupply", [])
    nfts = list(map(lambda nft: parse_esdt_token_data(nft, False), result))
    for i, card in enumerate(nfts):
        if card['attributes']['Class'] == student_card._class.name and \
           card['attributes']['Rarity'] == student_card.rarity.name and \
           card['attributes']['Power'] == student_card.power.name:
           nonce = i + 1

    if nonce == -1:
        return nonce


@app.route("/exchange", methods=['POST'])
def exchange():

    data = request.json
    src_collection_id = data.get('srcCollectionId')
    src_nonce = data.get('srcNonce')
    dst_nonce = data.get('dstNonce')

    if not src_collection_id or not src_nonce or not dst_nonce:
        return jsonify({"err": "Invalid JSON"}), 400

    print('Found nonce: ', dst_nonce)

    nft = Token(identifier=src_collection_id, nonce=src_nonce)
    transfer = TokenTransfer(token=nft, amount=1)

    result = call_contract("exchangeNft", arguments=[U64Value(dst_nonce)], tokens=[transfer])

    if result == None:
        return jsonify({"err": "Could not exchange NFT"}), 400

    exchange_history.append({\
        "sender": address.bech32(), \
        "srcCollectionId": src_collection_id, \
        "srcNonce": src_nonce, \
        "dstNonce": dst_nonce \
    })

    return jsonify({}), 200


@app.route("/nftSupply")
def nftSupply():
    result = query_contract("nftSupply", [])
    parsed_result = list(map(lambda nft: parse_esdt_token_data(nft, True), result))
    return jsonify(parsed_result), 200

@app.route("/createNftCollection", methods = ['POST'])
def createNftCollection():
    data = request.json
    collection_name = data.get('collectionName')
    ticker = data.get('ticker')

    if not collection_name or  not ticker:
        return jsonify({"err": "Invalid json"}), 400 

    config = TransactionsFactoryConfig(chain_id="D")
    factory = TokenManagementTransactionsFactory(config=config)
    transaction = factory.create_transaction_for_issuing_non_fungible(
        sender=address,
        token_name=collection_name,
        token_ticker=ticker,
        can_freeze=True,
        can_wipe=True,
        can_pause=True,
        can_transfer_nft_create_role=True,
        can_change_owner=True,
        can_upgrade=True,
        can_add_special_roles=True
    )

    result = send_transaction_sync(tx=transaction)

    if result == None:
        return jsonify({"err": "Create NFT transaction failed"}), 500

    if len(result.contract_results.items) < 1:
        return jsonify({"err": "Could not retrieve collection identifier from transaction"}), 500 


    collection_id = bytes.fromhex(result.contract_results.items[0].data.split("@")[1]).decode()

    transaction = factory.create_transaction_for_setting_special_role_on_non_fungible_token(
        sender=address,
        user=address,
        token_identifier=collection_id,
        add_role_nft_create=True,
        add_role_nft_burn=True
    )
    send_transaction_sync(tx=transaction)
    create_collection_history.append({\
        "sender": address.bech32(), \
        "collectionName": collection_name, \
        "ticker": ticker, \
        "collectionId": collection_id \
    })
    return jsonify(collection_id), 200

@app.route("/issueNft", methods = ['POST'])
def issueNft():

    data = request.json
    collection_id = data.get('collectionId')
    nft_name = data.get('nftName')
    _class = data.get('class')
    rarity = data.get('rarity')
    power = data.get('power')

    if not collection_id or \
        not nft_name or \
        not _class or not rarity or not power:
        return jsonify({"err": "Invalid JSON"}), 400

    if not _class in Class._member_names_:
        return jsonify({"err": "Invalid class"}), 400

    
    if not rarity in Rarity._member_names_:
        return jsonify({"err": "Invalid rarity"}), 400


    if not power in Power._member_names_:
        return jsonify({"err": "Invalid power"}), 400

    class_idx = Class[_class].value
    rarity_idx = Rarity[rarity].value
    power_idx = Power[power].value

    print(class_idx, rarity_idx, power_idx)

    attributes = int.to_bytes(class_idx, 1, "big") + \
                 int.to_bytes(rarity_idx, 1, "big") + \
                 int.to_bytes(power_idx, 1, "big")

    config = TransactionsFactoryConfig(chain_id="D")
    factory = TokenManagementTransactionsFactory(config=config)
    transaction = factory.create_transaction_for_creating_nft(
        sender=address,
        token_identifier=collection_id,
        initial_quantity=1,
        name=nft_name,
        royalties=0,
        hash=hashlib.sha256(attributes).hexdigest(),
        attributes=attributes,
        uris=[NFT_PICTURE]
    )

    result = send_transaction_sync(tx=transaction)
    try:
        result = result.contract_results.items
        issued_nonce = int.from_bytes(bytes.fromhex(result[0].data.split('@')[2]), 'big')
        issue_nft_history.append({\
            "sender": address.bech32(), \
            "collectionId": collection_id, \
            "nonce": issued_nonce \
        })
        return jsonify({"collectionId": collection_id, "nonce": issued_nonce}), 200
    except:
        return jsonify({"err": "Can't retrieve NFT nonce"}), 500

@app.route("/getCardHistory")
def getCardHistory():
    return jsonify(get_card_history), 200

@app.route("/createCollectionHistory")
def createCollectionHistory():
    return jsonify(create_collection_history), 200

@app.route("/issueNftHistory")
def issueNftHistory():
    return jsonify(issue_nft_history), 200

@app.route("/exchangeHistory")
def exchangeHistory():
    return jsonify(exchange_history), 200




