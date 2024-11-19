import React, { useEffect, useState } from 'react';
import './NftTable.css';

// Subcomponents for attributes
const ClassAttribute = ({ classType }) => <span>{classType || 'N/A'}</span>;
const PowerAttribute = ({ power }) => <span>{power || 'N/A'}</span>;
const RarityAttribute = ({ rarity }) => <span>{rarity || 'N/A'}</span>;

const NftTable = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/nftSupply');
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
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="table-container">
            <h1>Here you are your available nfts lol</h1>
            <table className="scrollable-table">
                <thead>
                    <tr>
                        <th>Token Type</th>
                        <th>Amount</th>
                        <th>Frozen</th>
                        <th>Token Hash</th>
                        <th>Name</th>
                        <th>Class</th>
                        <th>Power</th>
                        <th>Rarity</th>
                        <th>Creator</th>
                        <th>Royalties</th>
                        <th>URIs</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={index}>
                            <td><div className="scrollable-cell">{item.token_type}</div></td>
                            <td><div className="scrollable-cell">{item.amount}</div></td>
                            <td><div className="scrollable-cell">{item.frozen ? 'Yes' : 'No'}</div></td>
                            <td><div className="scrollable-cell">{item.token_hash}</div></td>
                            <td><div className="scrollable-cell">{item.name}</div></td>
                            <td>
                                <div className="scrollable-cell">
                                    <ClassAttribute classType={item.attributes?.Class} />
                                </div>
                            </td>
                            <td>
                                <div className="scrollable-cell">
                                    <PowerAttribute power={item.attributes?.Power} />
                                </div>
                            </td>
                            <td>
                                <div className="scrollable-cell">
                                    <RarityAttribute rarity={item.attributes?.Rarity} />
                                </div>
                            </td>
                            <td><div className="scrollable-cell">{item.creator}</div></td>
                            <td><div className="scrollable-cell">{item.royalties}</div></td>
                            <td>
                                <div className="scrollable-cell">
                                    {item.uris && item.uris.length > 0
                                        ? item.uris.join(', ')
                                        : 'N/A'}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default NftTable;
