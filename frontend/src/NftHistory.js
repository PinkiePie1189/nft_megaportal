import React, { useEffect, useState } from 'react';
import './NftHistory.css';

// Reusable table component
const Table = ({ title, columns, endpoint }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5000/${endpoint}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [endpoint]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="table-container">
            <h2>{title}</h2>
            <table className="scrollable-table">
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index}>{col[0]}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={index}>
                            {columns.map((col, idx) => (
                                <td key={idx}>
                                    <div className="scrollable-cell">
                                        {item[col[1]] || 'N/A'}
                                    </div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const NftHistory = () => {
    return (
        <div className="multi-table-container">
            <Table
                title="Card History"
                columns={[['Sender', 'sender'], ['Class', 'class'], ['Rarity', 'rarity'], ['Power', 'power']]}
                endpoint="/getCardHistory"
            />
            <Table
                title="Collection History"
                columns={[['Sender', 'sender'], ['Collection Name', 'collectionName'], ['Ticker', 'ticker'], ['Collection ID', 'collectionId']]}
                endpoint="/createCollectionHistory"
            />
            <Table
                title="NFT Issue History"
                columns={[['Sender', 'sender'], ['Collection ID', 'collectionId'], ['Nonce', 'nonce']]}
                endpoint="/issueNftHistory"
            />
            <Table
                title="Exchange History"
                columns={[['Sender', 'sender'], ['Source Collection ID', 'srcCollectionId'], ['Source Nonce', 'srcNonce'], ['Destination Nonce', 'dstNonce']]}
                endpoint="/exchangeHistory"
            />
        </div>
    );
};

export default NftHistory;
