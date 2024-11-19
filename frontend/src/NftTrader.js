import React, { useEffect, useState } from "react";

const API_URL = 'http://127.0.0.1:5000'

const NFTActions = () => {

    const [statuses, setStatuses] = useState({
        generateCard: { loading: false, success: null, result: "", inputs: {} },
        createCollection: { loading: false, success: null, result: "", inputs: { collectionName: "", ticker: "" } },
        issueNFT: { loading: false, success: null, result: "", inputs: { collectionId: "", nftName: "", class: "", rarity: "", power: "" } },
        exchangeNFT: { loading: false, success: null, result: "", inputs: { srcCollectionId: "", srcNonce: -1, dstNonce: -1} },
    });

    useEffect(() => {
        if (statuses.generateCard.loading) {
            fetch(`${API_URL}/getYourNftCardProperties`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error()
                    }
                    return response.json()
                })
                .then((response) => {
                    setStatuses((prev) => ({
                        ...prev,
                        issueNFT: {...prev.issueNFT, inputs: {...prev.issueNFT.inputs, class: response["Class"], rarity: response["Rarity"], power: response["Power"]}},
                        exchangeNFT: { ...prev.exchangeNFT, inputs: {...prev.exchangeNFT.inputs, dstNonce: response["matchingNonce"]}},
                        generateCard: { 
                            ...prev.generateCard,
                            loading: false, success: true,
                            result: `Found nonce: ${response["matchingNonce"]}\nClass: ${response["Class"]}\nRarity: ${response["Rarity"]}\nPower: ${response["Power"]}` 
                        }
                    }))
                })
                .catch(() => {
                    setStatuses((prev) => ({
                        ...prev,
                        generateCard: { ...prev.generateCard, loading: false, success: false }
                    }))
                })
        }
    }, [statuses.generateCard.loading])

    useEffect(() => {
        if (statuses.createCollection.loading) {
            fetch(`${API_URL}/createNftCollection`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(statuses.createCollection.inputs)
            }).then((response) => {
                if (!response.ok) {
                    throw new Error()
                }
                return response.json()
            }).then((response) => {
                setStatuses((prev) => ({
                    ...prev,
                    issueNFT: {...prev.issueNFT, inputs: {...prev.issueNFT.inputs, collectionId: response}},
                    createCollection: { ...prev.createCollection, loading: false, success: true, result: response }
                }))
            }).catch(() => {
                setStatuses((prev) => ({
                    ...prev,
                    createCollection: { ...prev.createCollection, loading: false, success: false }
                }))
            })
        }
    }, [statuses.createCollection.loading])

    useEffect(() => {
        if (statuses.issueNFT.loading) {
            fetch(`${API_URL}/issueNft`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(statuses.issueNFT.inputs)
            }).then((response) => {
                if (!response.ok) {
                    throw new Error()
                }
                return response.json()
            }).then((response) => {
                setStatuses((prev) => ({
                    ...prev,
                    exchangeNFT: {...prev.exchangeNFT, inputs: {...prev.exchangeNFT.inputs, srcCollectionId: response["collectionId"], srcNonce: response["nonce"]}},
                    issueNFT: { ...prev.issueNFT, loading: false, success: true, result: `Issued NFT at ${response["collectionId"]} nonce ${response["nonce"]}` }
                }))
            }).catch(() => {
                setStatuses((prev) => ({
                    ...prev,
                    issueNFT: { ...prev.issueNFT, loading: false, success: false }
                }))
            })
        }
    }, [statuses.issueNFT.loading])

    useEffect(() => {
        if (statuses.exchangeNFT.loading) {
            fetch(`${API_URL}/exchange`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(statuses.exchangeNFT.inputs)
            }).then((response) => {
                if (!response.ok) {
                    throw new Error()
                }
                return response.json()
            }).then((response) => {
                setStatuses((prev) => ({
                    ...prev,
                    exchangeNFT: { ...prev.exchangeNFT, loading: false, success: true, result: `Successfully exchanged NFTs!` }
                }))
            }).catch(() => {
                setStatuses((prev) => ({
                    ...prev,
                    exchangeNFT: { ...prev.exchangeNFT, loading: false, success: false }
                }))
            })
        } 
    }, [statuses.exchangeNFT.loading])

    // Simulate an API call
    const mockApiCall = async (key) => {
        setStatuses((prev) => ({
            ...prev,
            [key]: { ...prev[key], loading: true, success: null },
        }));
    };

    // Handle input field changes
    const handleInputChange = (key, field, value) => {
        setStatuses((prev) => ({
            ...prev,
            [key]: {
                ...prev[key],
                inputs: { ...prev[key].inputs, [field]: value },
            },
        }));
    };

    // Define actions with their inputs
    const actions = [
        {
            label: "Generate your NFT card",
            key: "generateCard",
            inputs: []
        },
        {
            label: "Create NFT collection",
            key: "createCollection",
            inputs: [
                { label: "Collection Name", field: "collectionName" },
                { label: "Ticker", field: "ticker"}
            ],
        },
        {
            label: "Issue NFT",
            key: "issueNFT",
            inputs: [
                { label: "Collection ID", field: "collectionId" },
                { label: "NFT name", field: "nftName" },
                { label: "Class", field: "class"},
                { label: "Rarity", field: "rarity"},
                { label: "Power", field: "power"}
            ],
        },
        {
            label: "Exchange NFT",
            key: "exchangeNFT",
            inputs: [
                { label: "Collection ID of your NFT", field: "srcCollectionId"},
                { label: "Nonce of your NFT", field: "srcNonce" },
                { label: "Nonce of target NFT", field: "dstNonce" },
            ],
        },
    ];

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "20px"}}>
            {actions.map(({ label, key, inputs }) => (
                <div
                    key={key}
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: "10px",
                        padding: "20px",
                        marginBottom: "20px",
                        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    {/* Input Fields */}
                    <div style={{ marginBottom: "15px" }}>
                        {inputs.map(({ label, field }) => (
                            <div key={field} style={{ marginBottom: "10px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontWeight: "bold",
                                        marginBottom: "5px",
                                    }}
                                >
                                    {label}
                                </label>
                                <input
                                    type="text"
                                    value={statuses[key].inputs ? (statuses[key].inputs[field] ? statuses[key].inputs[field] : ""): ""}
                                    onChange={(e) =>
                                        handleInputChange(key, field, e.target.value)
                                    }
                                    style={{
                                        padding: "10px",
                                        width: "100%",
                                        border: "1px solid #ddd",
                                        borderRadius: "5px",
                                    }}
                                    placeholder={`Enter ${label}`}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Button */}
                    <button
                        onClick={() => mockApiCall(key)}
                        style={{
                            padding: "10px 20px",
                            position: "relative",
                            display: "inline-flex",
                            alignItems: "center",
                            cursor: statuses[key].loading ? "not-allowed" : "pointer",
                            backgroundColor:
                                statuses[key].success === true
                                    ? "#4CAF50"
                                    : statuses[key].success === false
                                        ? "#F44336"
                                        : "#008CBA",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                        }}
                        disabled={statuses[key].loading}
                    >
                        {statuses[key].loading && (
                            <span
                                style={{
                                    width: "15px",
                                    height: "15px",
                                    border: "2px solid white",
                                    borderTop: "2px solid transparent",
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite",
                                    marginRight: "10px",
                                }}
                            ></span>
                        )}
                        {statuses[key].success === true && <span> ✔️ </span>}
                        {statuses[key].success === false && <span>  ❌ </span>}
                        {label}
                    </button>

                    {/* Result Textbox */}
                    <div style={{ marginTop: "10px" }}>
                        <textarea
                            value={statuses[key].result}
                            readOnly
                            style={{
                                width: "100%",
                                padding: "10px",
                                border: "1px solid #ddd",
                                borderRadius: "5px",
                                marginTop: "10px",
                                resize: "none",
                                height: "50px",
                            }}
                            placeholder="Result will appear here"
                        />
                    </div>
                </div>
            ))}

            {/* Add CSS for spinner */}
            <style>
                {`
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        `}
            </style>
        </div>
    );
};

export default NFTActions;

