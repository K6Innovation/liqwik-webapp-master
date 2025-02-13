"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { ethers, formatUnits } from "ethers";

export default function AccountPage() {
  const [balance, setBalance] = useState<string | undefined>();
  const [currentAccount, setCurrentAccount] = useState<string | undefined>();
  const [chainId, setChainId] = useState<string | undefined>();
  const [chainname, setChainName] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      if (!currentAccount || !ethers.isAddress(currentAccount)) {
        setBalance(undefined);
        setChainId(undefined);
        setChainName(undefined);
        return;
      }
      const { ethereum }: any = window;
      if (!ethereum) {
        console.log("Please install MetaMask");
        return;
      }
      try {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        console.log(signer);
        const balance = await provider.getBalance(currentAccount);
        setBalance(formatUnits(balance, "ether"));
        const network = await provider.getNetwork();
        setChainId(`${network.chainId}`);
        setChainName(network.name);
      } catch (e) {}
    })();
  }, [currentAccount]);

  const onClickConnect = async () => {
    const { ethereum }: any = window;
    if (!ethereum) {
      console.log("Please install MetaMask");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) setCurrentAccount(accounts[0]);
    } catch (e) {
      console.log(e);
    }
  };

  const onClickDisconnect = async () => {
    const { ethereum }: any = window;
    if (!ethereum) {
      console.log("Please install MetaMask");
      return;
    }
    setCurrentAccount(undefined);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="p-10">
        <h1 className="text-4xl font-bold">Welcome to Next.js + Ethers.js</h1>
        <p>ChainID: {chainId}</p>
        <p>ChainName: {chainname}</p>
        <p>Account: {currentAccount}</p>
        <p>Balance: {balance} ETH</p>
      </div>
      <div className="p-10 flex gap-2">
        {currentAccount ? (
          <button className="btn btn-error" onClick={onClickDisconnect}>
            Disconnect Metamask
          </button>
        ) : (
          <button className={`btn btn-info`} onClick={onClickConnect}>
            Connect Metamask
          </button>
        )}
      </div>
    </main>
  );
}
