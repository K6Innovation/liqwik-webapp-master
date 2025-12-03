// src/app/components/assets/asset-form.tsx
"use client";

import React, {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Required from "../widgets/required";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Props = {
  asset: {
    id: number;
    billToPartyId: string;
    invoiceNumber: string;
    invoiceDate: string;
    faceValue: number;
    paymentDate: string;
    proposedDiscount?: number;
    auctionStatus: string;
    termMonths: number;
    apy: number;
    fees?: number;
    invoiceFilePath?: string;
    bankStatementFilePath?: string;
    billToPartyHistoryFilePath?: string;
    feeApprovedBySeller?: boolean;
    validatedByBillToParty?: boolean;
    isPosted?: boolean;
    isCancelled?: boolean;
  };
  postSaveAction?: (asset: any) => void;
  onWalletUpdate?: () => void;
};

const inputH = "h-[2.5rem] min-h-[2.5rem]";
const errorBorder = "border-pink-700";

export default function AssetForm({ asset, postSaveAction, onWalletUpdate }: Props) {
  const session: any = useSession();
  const router = useRouter();
  const [showTokenInfo, setShowTokenInfo] = useState(false);
  const [showTokenImage, setShowTokenImage] = useState(false);
  const [showValidateBtn, setShowValidateBtn] = useState(false);
  const [highlightValidate, setHighlightValidate] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{
    status: string;
    message: string;
  } | null>(null);
  const [errorFields, setErrorFields] = useState<string[]>([]);
  const [billToParties, setBillToParties] = useState<any[]>([]);
  const [assetCopy, setAssetCopy] = useState(asset);
  const [showFeePopup, setShowFeePopup] = useState(false);
  const [showConfirmTransferPopup, setShowConfirmTransferPopup] = useState(false);
  const [feeApprovedLocally, setFeeApprovedLocally] = useState(false);
  const [validationEmailSent, setValidationEmailSent] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [tokenColor, setTokenColor] = useState<'silver' | 'copper' | 'gold'>('silver');
  const [savedAssetData, setSavedAssetData] = useState<any>(null);
  const [checkingValidation, setCheckingValidation] = useState(false);
  const [validationCheckInterval, setValidationCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // File validation state
  const [fileErrors, setFileErrors] = useState<{
    invoiceFile?: string;
    bankStatementFile?: string;
    billToPartyHistoryFile?: string;
  }>({});

  // Calculate APY based on proposed discount and term
  const calculatedAPY = useMemo(() => {
    if (assetCopy.proposedDiscount && assetCopy.termMonths) {
      return (assetCopy.proposedDiscount / (assetCopy.termMonths / 12));
    }
    return assetCopy.apy || 0;
  }, [assetCopy.proposedDiscount, assetCopy.termMonths, assetCopy.apy]);

  // Calculate fees (1% of face value)
  const calculatedFees = useMemo(() => {
    return assetCopy.faceValue ? (assetCopy.faceValue * 0.01) : 0;
  }, [assetCopy.faceValue]);

  // Get first two digits of face value
  const faceValueFirstTwo = useMemo(() => {
    const faceValue = assetCopy.faceValue?.toString() || "0";
    return faceValue.length >= 2 ? faceValue.substring(0, 2) : faceValue.padStart(2, '0');
  }, [assetCopy.faceValue]);

  // Check validation status
  const checkValidationStatus = async (assetId: string) => {
    try {
      const response = await fetch(`/api/sellers/${session?.data?.user?.id}/assets/${assetId}/check-validation`);
      if (response.ok) {
        const data = await response.json();
        return data.validatedByBillToParty;
      }
    } catch (error) {
      console.error('Error checking validation status:', error);
    }
    return false;
  };

  // Start polling for validation
  const startValidationPolling = (assetId: string) => {
    if (validationCheckInterval) {
      clearInterval(validationCheckInterval);
    }

    const interval = setInterval(async () => {
      const isValidated = await checkValidationStatus(assetId);
      if (isValidated) {
        setCheckingValidation(false);
        if (validationCheckInterval) {
          clearInterval(validationCheckInterval);
        }
        // Automatically update to gold token
        setTokenValidated(true);
        setTokenColor('gold');
        setSaveStatus({
          status: "success",
          message: "Bill-To Party validated! You can now post the token or cancel it.",
        });
        
        // Trigger wallet update
        if (onWalletUpdate) {
          onWalletUpdate();
        }
      }
    }, 3000);

    setValidationCheckInterval(interval);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (validationCheckInterval) {
        clearInterval(validationCheckInterval);
      }
    };
  }, [validationCheckInterval]);

  // Validate file
  const validateFile = (file: File, fieldName: string): boolean => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg'
    ];
    
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setFileErrors(prev => ({
        ...prev,
        [fieldName]: 'Invalid file type. Please upload PDF, Word, PNG, or JPG files.'
      }));
      return false;
    }

    if (file.size > maxSize) {
      setFileErrors(prev => ({
        ...prev,
        [fieldName]: 'File size exceeds 10MB limit.'
      }));
      return false;
    }

    setFileErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName as keyof typeof newErrors];
      return newErrors;
    });
    
    return true;
  };

  // Save asset function
  const saveAsset = async () => {
  if (!formRef.current) return null;
  
  setIsLoading(true);
  try {
    const formData = new FormData(formRef.current);
    
    if (asset.id) {
      formData.append("id", asset.id.toString());
    }
    
    formData.append("apy", calculatedAPY.toString());
    formData.append("fees", calculatedFees.toString());
    
    const url = !asset.id
      ? `/api/sellers/${session?.data?.user?.id}/assets`
      : `/api/sellers/${session?.data?.user?.id}/assets/${asset.id}`;
    
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(
        error || "Failed to submit the data. Please try again."
      );
    }
    
    const data = await response.json();
    setSavedAssetData(data);
    
    setSaveStatus({
      status: "success",
      message: "Asset saved successfully",
    });
    
    // Trigger wallet update after successful save
    if (onWalletUpdate) {
      onWalletUpdate();
    }
    
    return data;
  } catch (error: any) {
    setSaveStatus({
      status: "error",
      message: error.message || "Failed to save the asset",
    });
    console.log(error);
    return null;
  } finally {
    setIsLoading(false);
  }
};
  // const saveAsset = async () => {
  //   if (!formRef.current) return null;
    
  //   setIsLoading(true);
  //   try {
  //     const formData = new FormData(formRef.current);
      
  //     if (asset.id) {
  //       formData.append("id", asset.id.toString());
  //     }
      
  //     formData.append("apy", calculatedAPY.toString());
  //     formData.append("fees", calculatedFees.toString());
      
  //     const url = !asset.id
  //       ? `/api/sellers/${session?.data?.user?.id}/assets`
  //       : `/api/sellers/${session?.data?.user?.id}/assets/${asset.id}`;
      
  //     const response = await fetch(url, {
  //       method: "POST",
  //       body: formData,
  //     });
      
  //     if (!response.ok) {
  //       const { error } = await response.json();
  //       throw new Error(
  //         error || "Failed to submit the data. Please try again."
  //       );
  //     }
      
  //     const data = await response.json();
  //     setSavedAssetData(data);
      
  //     setSaveStatus({
  //       status: "success",
  //       message: "Asset saved successfully",
  //     });
      
  //     return data;
  //   } catch (error: any) {
  //     setSaveStatus({
  //       status: "error",
  //       message: error.message || "Failed to save the asset",
  //     });
  //     console.log(error);
  //     return null;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Confirm bank transfer and approve fee
  const handleConfirmBankTransfer = async () => {
    setShowConfirmTransferPopup(false);
    setShowTokenImage(false);
    
    const savedAsset = await saveAsset();
    
    if (savedAsset) {
      // Update asset in database to mark fee as approved
      try {
        const response = await fetch(
          `/api/sellers/${session?.data?.user?.id}/assets/${savedAsset.id}/approve-fee`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          setFeeApprovedLocally(true);
          setTokenColor('copper');
          setShowTokenImage(true);
          setShowValidateBtn(true);
          
          if (onWalletUpdate) {
            onWalletUpdate();
          }
          
          setSaveStatus({
            status: "success",
            message: "Fee approved! Click 'Validate' to send validation request to Bill-To Party.",
          });
        } else {
          throw new Error("Failed to approve fee");
        }
      } catch (error: any) {
        setSaveStatus({
          status: "error",
          message: error.message || "Failed to approve fee",
        });
      }
    }
  };

  // Send validation email to bill to party
  const handleValidateClick = async () => {
    if (!savedAssetData) return;
    
    setIsLoading(true);
    try {
      const billToParty = billToParties.find(party => party.id === savedAssetData.billToPartyId);
      if (!billToParty || !billToParty.email) {
        throw new Error("Bill to party email not found");
      }

      const response = await fetch('/api/send-bill-to-party-validation-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billToPartyEmail: billToParty.email,
          billToPartyName: billToParty.name,
          sellerName: session?.data?.user?.name || session?.data?.user?.username,
          assetData: {
            id: savedAssetData.id,
            invoiceNumber: savedAssetData.invoiceNumber,
            faceValue: savedAssetData.faceValue,
            feeAmount: calculatedFees.toFixed(2),
            paymentDate: savedAssetData.paymentDate,
          }
        }),
      });

      if (response.ok) {
        setValidationEmailSent(true);
        setCheckingValidation(true);
        startValidationPolling(savedAssetData.id);
        
        setSaveStatus({
          status: "info",
          message: "Validation email sent to Bill-To Party. Waiting for their approval...",
        });
      } else {
        throw new Error("Failed to send validation email");
      }
    } catch (error: any) {
      setSaveStatus({
        status: "error",
        message: error.message || "Failed to send validation email",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostToken = async () => {
    if (!savedAssetData) return;
    
    setIsPosting(true);
    try {
      const response = await fetch(
        `/api/sellers/${session?.data?.user?.id}/assets/${savedAssetData.id}/post`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const postedAsset = await response.json();
        setSaveStatus({
          status: "success",
          message: "Asset posted successfully to Liqwik!",
        });
        
        if (onWalletUpdate) {
          onWalletUpdate();
        }

        // Redirect to seller asset page after 2 seconds
        setTimeout(() => {
          router.push(`/sellers/${session?.data?.user?.id}/assets/${savedAssetData.id}`);
        }, 2000);
      } else {
        const { error } = await response.json();
        setSaveStatus({
          status: "error",
          message: error || "Failed to post asset",
        });
      }
    } catch (error: any) {
      setSaveStatus({
        status: "error",
        message: error.message || "Failed to post asset",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleCancelToken = async () => {
    if (!savedAssetData) return;
    
    setIsCancelling(true);
    try {
      const response = await fetch(
        `/api/sellers/${session?.data?.user?.id}/assets/${savedAssetData.id}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const cancelledAsset = await response.json();
        setSaveStatus({
          status: "info",
          message: "Asset cancelled successfully.",
        });
        
        if (onWalletUpdate) {
          onWalletUpdate();
        }

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push(`/sellers/${session?.data?.user?.id}`);
        }, 2000);
      } else {
        const { error } = await response.json();
        setSaveStatus({
          status: "error",
          message: error || "Failed to cancel asset",
        });
      }
    } catch (error: any) {
      setSaveStatus({
        status: "error",
        message: error.message || "Failed to cancel asset",
      });
    } finally {
      setIsCancelling(false);
    }
  };
  
  const validateForm = () => {
    if (!formRef.current) return [];
    const formData = new FormData(formRef.current);
    
    const required = [
      'billToPartyId',
      'invoiceNumber',
      'invoiceDate',
      'faceValue',
      'paymentDate',
      'termMonths',
      'invoiceFile',
      'bankStatementFile',
      'billToPartyHistoryFile'
    ];
    
    return required.filter((field) => {
      const value = formData.get(field);
      if (value instanceof File) {
        return value.size === 0;
      }
      return !value;
    });
  };

  const handleCreateToken = () => {
    const missingFields = validateForm();
    setErrorFields(missingFields);
  
    if (missingFields.length > 0 || Object.keys(fileErrors).length > 0) {
      setSaveStatus({
        status: "error",
        message: "Please fill all mandatory fields and fix file errors before creating a token.",
      });
      return;
    }
  
    setSaveStatus(null);
  
    setTokenColor('silver');
    setShowTokenInfo(true);
    setTimeout(() => {
      setShowTokenImage(true);
      setTimeout(() => {
        setShowValidateBtn(true);
        setHighlightValidate(true);
        setTimeout(() => {
          setHighlightValidate(false);
        }, 2000);
      }, 0);
    }, 3000);
  };

  useEffect(() => {
    (async () => {
      const response = await fetch(`/api/bill-to-parties`).then((res) =>
        res.json()
      );
      setBillToParties(response);
    })();
  }, [session]);

  useEffect(() => {
    setAssetCopy(asset);
  }, [asset]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const updateErrorFields = useMemo(
    () =>
      function onChange(
        event: FormEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>
      ) {
        if (!formRef.current) return;
        
        if (event.target instanceof HTMLInputElement && event.target.type === 'file') {
          const files = event.target.files;
          if (files && files.length > 0) {
            validateFile(files[0], event.target.name);
          }
        }
        
        const errorFields = validateForm();
        setErrorFields(errorFields);
        
        if (event.target) {
          const { name, value }: any = event.target;
          setAssetCopy((prev) => ({ ...prev, [name]: value }));
        }
      },
    []
  );

  const onDateChange = useMemo(
    () =>
      function onDateChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        const date = dayjs(value);
        setAssetCopy((prev) => ({ ...prev, [name]: date }));
        updateErrorFields(event);
      },
    [updateErrorFields]
  );

  return (
    <div className="mx-auto p-6 relative bg-white min-h-screen">
      <div className="flex items-center mt-10 justify-between mb-2">
        <h1 className="text-2xl text-pink-700 font-bold">
          {!asset.id ? "New Liqwik Asset" : "Edit Liqwik Asset"}
        </h1>
      </div>
      <form onSubmit={onSubmit} ref={formRef}>
        <div className="mb-4">
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mt-4 mb-1">
              Bill-To Party
              <Required />
            </div>
            <select
              className={`
                select select-bordered w-full ${inputH}
                ${errorFields.includes("billToPartyId") && errorBorder}
              `}
              name="billToPartyId"
              onChange={updateErrorFields}
              value={assetCopy.billToPartyId || ""}
            >
              <option value="">Select Bill-To Party</option>
              {billToParties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Invoice Number
              <Required />
            </div>
            <input
              type="text"
              className={`
                input input-bordered input-md w-full ${inputH}
                ${errorFields.includes("invoiceNumber") && errorBorder}
              `}
              name="invoiceNumber"
              onChange={updateErrorFields}
              value={assetCopy.invoiceNumber || ""}
            />
          </label>
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Invoice Date
              <Required />
            </div>
            <input
              type="date"
              className={`input input-bordered input-md w-full ${inputH} ${
                errorFields.includes("invoiceDate") && errorBorder
              }`}
              name="invoiceDate"
              onChange={onDateChange}
              value={dayjs(assetCopy.invoiceDate).format("YYYY-MM-DD") || ""}
            />
          </label>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Face Value
              <Required />
            </div>
            <label
              className={`input input-bordered flex items-center gap-1 ${inputH} ${
                errorFields.includes("faceValue") && errorBorder
              }`}
            >
              €
              <input
                type="text"
                className={`input input-md w-full ${inputH} focus:border-0`}
                name="faceValue"
                onChange={updateErrorFields}
                value={assetCopy.faceValue || ""}
              />
            </label>
          </label>
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Payment Due
              <Required />
              <span className="ml-2">
                {assetCopy.paymentDate
                  ? dayjs(assetCopy.paymentDate).diff(dayjs(), "days")
                  : ""}
                d
              </span>
            </div>
            <input
              type="date"
              className={`input input-bordered input-md w-full ${inputH} ${
                errorFields.includes("paymentDate") && errorBorder
              }`}
              name="paymentDate"
              onChange={onDateChange}
              value={dayjs(assetCopy.paymentDate).format("YYYY-MM-DD") || ""}
            />
          </label>
        </div>
        
        <div className="mb-4">
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Upload Invoice
              <Required />
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className={`
                file-input file-input-bordered file-input-sm w-full ${inputH}
                ${errorFields.includes("invoiceFile") && errorBorder}
              `}
              name="invoiceFile"
              onChange={updateErrorFields}
            />
            {fileErrors.invoiceFile && (
              <span className="text-xs text-red-600 mt-1">{fileErrors.invoiceFile}</span>
            )}
            {assetCopy.invoiceFilePath && (
              <span className="text-xs text-green-600 mt-1">
                Current: {assetCopy.invoiceFilePath.split('/').pop()}
              </span>
            )}
          </label>
        </div>
        
        <div className="mb-4">
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Upload 12 Months Bank Statement
              <Required />
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className={`
                file-input file-input-bordered file-input-sm w-full ${inputH}
                ${errorFields.includes("bankStatementFile") && errorBorder}
              `}
              name="bankStatementFile"
              onChange={updateErrorFields}
            />
            {fileErrors.bankStatementFile && (
              <span className="text-xs text-red-600 mt-1">{fileErrors.bankStatementFile}</span>
            )}
            {assetCopy.bankStatementFilePath && (
              <span className="text-xs text-green-600 mt-1">
                Current: {assetCopy.bankStatementFilePath.split('/').pop()}
              </span>
            )}
          </label>
        </div>
        
        <div className="mb-4">
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Upload Bill to party history
              <Required />
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className={`
                file-input file-input-bordered file-input-sm w-full ${inputH}
                ${errorFields.includes("billToPartyHistoryFile") && errorBorder}
              `}
              name="billToPartyHistoryFile"
              onChange={updateErrorFields}
            />
            {fileErrors.billToPartyHistoryFile && (
              <span className="text-xs text-red-600 mt-1">{fileErrors.billToPartyHistoryFile}</span>
            )}
            {assetCopy.billToPartyHistoryFilePath && (
              <span className="text-xs text-green-600 mt-1">
                Current: {assetCopy.billToPartyHistoryFilePath.split('/').pop()}
              </span>
            )}
          </label>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mb-4">
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">Suggested Disc</div>
            <label
              className={`input input-bordered flex items-center gap-1 ${inputH}`}
            >
              <input
                type="number"
                className={`input input-md w-full ${inputH} focus:border-0`}
                name="proposedDiscount"
                onChange={updateErrorFields}
                value={assetCopy.proposedDiscount || ""}
              />
              %
            </label>
          </label>
          <label className="form-control w-full">
            <div className="label-text text-gray-400 mb-1">
              Term Months
              <Required />
            </div>
            <input
              type="number"
              className={`input input-bordered input-md w-full ${inputH}
              ${errorFields.includes("termMonths") && errorBorder}`}
              name="termMonths"
              onChange={updateErrorFields}
              value={assetCopy.termMonths || ""}
            />
          </label>
          <div>
            <label className="block label-text text-gray-400 mb-3">APY</label>
            <div className="flex items-center">
              <span className="text-lg font-semibold">{calculatedAPY.toFixed(1)}%</span>
            </div>
          </div>
        </div>
              
        {saveStatus && (
          <div className={`text-sm mt-1 italic ${
            saveStatus.status === 'error' ? 'text-red-700' : 
            saveStatus.status === 'info' ? 'text-blue-700' : 'text-green-700'
          }`}>
            {saveStatus.message}
          </div>
        )}

        <div className="flex flex-col gap-4 mb-4">
          {showTokenInfo && (
            <div className="w-100 bg-white shadow-lg border border-gray-200 rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-gray-800">Token Info</h2>

              <div className="flex justify-center">
                {!showTokenImage ? (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-700" />
                  </div>
                ) : (
                  <div className="relative w-64 h-64">
                    <Image
                      src={
                        tokenColor === 'gold' 
                          ? "/Transparent-Gold-image.png" 
                          : tokenColor === 'copper'
                          ? "/Transparent-Copper-image.png"
                          : "/Transparent-Silver-image.png"
                      }
                      alt="Token"
                      width={256}
                      height={256}
                      className="object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div 
                          className="absolute font-bold text-xl"
                          style={{ 
                            top: '18%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            color: tokenColor === 'gold' ? '#D4AF37' : tokenColor === 'copper' ? '#B87333' : '#C0C0C0'
                          }}
                        >
                          {assetCopy.termMonths || 0}
                        </div>
                        
                        <div 
                          className="absolute font-bold text-2xl"
                          style={{ 
                            top: '48%',
                            left: '58%',
                            transform: 'translateY(-50%)',
                            color: tokenColor === 'gold' ? '#D4AF37' : tokenColor === 'copper' ? '#B87333' : '#C0C0C0'
                          }}
                        >
                          {faceValueFirstTwo}
                        </div>
                        
                        <div 
                          className="absolute font-bold text-xl"
                          style={{ 
                            bottom: '18%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            color: tokenColor === 'gold' ? '#D4AF37' : tokenColor === 'copper' ? '#B87333' : '#C0C0C0'
                          }}
                        >
                          {calculatedAPY.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {checkingValidation && (
                <div className="flex items-center justify-center space-x-2 text-blue-700">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700" />
                  <span className="text-sm">Waiting for Bill-To Party validation...</span>
                </div>
              )}

              <div className="flex justify-end gap-3">
                {!feeApprovedLocally && showValidateBtn ? (
                  <button
                    type="button"
                    className={`py-2 px-4 rounded-lg shadow-md text-white transition 
                      ${highlightValidate ? "bg-pink-500 animate-pulse" : "bg-pink-700 hover:bg-pink-800"}
                    `}
                    onClick={() => setShowFeePopup(true)}
                  >
                    Pay Liqwik Fee
                  </button>
                ) : feeApprovedLocally && !validationEmailSent ? (
                  <button
                    type="button"
                    className="py-2 px-4 rounded-lg shadow-md text-white bg-pink-700 hover:bg-pink-800 transition"
                    onClick={handleValidateClick}
                  >
                    Validate
                  </button>
                ) : tokenValidated ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelToken}
                      disabled={isCancelling}
                      className="py-2 px-4 rounded-lg shadow-md text-white bg-gray-500 hover:bg-gray-600 transition disabled:opacity-50"
                    >
                      {isCancelling ? "Cancelling..." : "Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={handlePostToken}
                      disabled={isPosting}
                      className="py-2 px-4 rounded-lg shadow-md text-white bg-pink-500 hover:bg-pink-600 transition disabled:opacity-50"
                    >
                      {isPosting ? "Posting..." : "Post Token"}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 mb-4 mt-5 items-center">
            {!showTokenInfo && (
              <button
                type="button"
                onClick={handleCreateToken}
                className="w-40 bg-pink-700 text-white py-2 px-4 rounded-[6px] shadow-md hover:bg-pink-800 transition"
              >
                Create Token
              </button>
            )}
          </div>
        </div>
      </form>

      {showFeePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-[9999]">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
            <h2 className="text-lg font-semibold mb-4">Approve 1% Fee</h2>
            <p className="text-gray-700">Do you approve a 1% fee €{calculatedFees.toFixed(0)}?</p>
            <div className="flex justify-center mt-4 gap-4">
              <button
                onClick={() => {
                  setShowFeePopup(false);
                  setShowConfirmTransferPopup(true);
                }}
                className="px-4 py-2 bg-pink-700 text-white rounded-lg hover:bg-pink-800 transition"
              >
                Yes
              </button>
              <button
                onClick={() => setShowFeePopup(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmTransferPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-[9999]">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
            <h2 className="text-lg font-semibold mb-4">Confirm Bank Transfer</h2>
            <p className="text-gray-700">Confirm bank transfer of €{calculatedFees.toFixed(0)} to Liqwik for the token post.</p>
            <div className="flex justify-center mt-4 gap-4">
              <button
                onClick={handleConfirmBankTransfer}
                className="px-4 py-2 bg-pink-700 text-white rounded-lg hover:bg-pink-800 transition"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirmTransferPopup(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-[9999]">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-700" />
              <span>Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}