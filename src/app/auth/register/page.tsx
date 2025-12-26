"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BillToParty {
  name: string;
  email: string;
  address: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "buyer",
    organizationName: "",
    address: "",
    
    // KYB Fields for Seller
    legalBusinessName: "",
    registrationNumber: "",
    taxIdentificationNumber: "",
    businessType: "",
    industrySector: "",
    dateOfIncorporation: "",
    businessBankAccountDetails: "",
    authorizedSignatoryDetails: "",
    countryOfIncorporation: "",
    registeredBusinessAddress: "",
    operatingAddress: "",
    websiteUrl: "",
    listOfDirectors: "",
    ultimateBeneficialOwners: "",
    shareholdingStructure: "",
    
    // KYB / Company Information for Buyer
    companyName: "",
    businessRegistrationNumber: "",
    billingAddress: "",
    shippingAddress: "",
    companyWebsite: "",
    preferredPaymentMethod: "",
    bankDetails: "",
    purchaseOrderNumber: "",
  });

  const [billToParties, setBillToParties] = useState<BillToParty[]>([
    { name: "", email: "", address: "" }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [info, setInfo] = useState("");
  
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleBillToPartyChange = (index: number, field: keyof BillToParty, value: string) => {
    const updated = [...billToParties];
    updated[index][field] = value;
    setBillToParties(updated);
  };

  const addBillToParty = () => {
    setBillToParties([...billToParties, { name: "", email: "", address: "" }]);
  };

  const removeBillToParty = (index: number) => {
    if (billToParties.length > 1) {
      setBillToParties(billToParties.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setInfo("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate bill-to-parties for sellers
    if (formData.role === "seller") {
      const validBillToParties = billToParties.filter(
        btp => btp.name && btp.email && btp.address
      );
      
      if (validBillToParties.length === 0) {
        setError("Please add at least one Bill-to-Party with complete information");
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        billToParties: formData.role === "seller" 
          ? billToParties.filter(btp => btp.name && btp.email && btp.address)
          : undefined,
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isNewUser) {
          setSuccess("Registration successful! Redirecting to email verification...");
        } else {
          setSuccess(`${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} role added successfully! Redirecting to email verification...`);
          setInfo("Note: You can use the same credentials to login after verification.");
        }
        
        const verifyUrl = `/auth/verify-email?email=${encodeURIComponent(data.email)}&firstName=${encodeURIComponent(data.firstName)}&role=${encodeURIComponent(data.role)}&userRoleId=${encodeURIComponent(data.userRoleId)}`;
        
        setTimeout(() => {
          window.location.href = verifyUrl;
        }, 2000);
      } else {
        setError(data.error || "Registration failed");
        setLoading(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An error occurred during registration");
      setLoading(false);
    }
  };

  const renderBillToPartyFields = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-lg font-semibold text-gray-800">Bill-to-Party Information</h3>
        <button
          type="button"
          onClick={addBillToParty}
          className="text-sm px-3 py-1 bg-pink-600 text-white rounded hover:bg-pink-700"
        >
          + Add Another
        </button>
      </div>

      {billToParties.map((btp, index) => (
        <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-md font-medium text-gray-700">
              Bill-to-Party #{index + 1}
            </h4>
            {billToParties.length > 1 && (
              <button
                type="button"
                onClick={() => removeBillToParty(index)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={btp.name}
              onChange={(e) => handleBillToPartyChange(index, "name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Enter bill-to-party company name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={btp.email}
              onChange={(e) => handleBillToPartyChange(index, "email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Enter bill-to-party email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={btp.address}
              onChange={(e) => handleBillToPartyChange(index, "address", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Enter bill-to-party address"
              required
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderSellerKYBFields = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">KYB Information (Seller)</h3>
      
      <div>
        <label htmlFor="legalBusinessName" className="block text-sm font-medium text-gray-700 mb-1">
          Legal Business Name
        </label>
        <input
          id="legalBusinessName"
          name="legalBusinessName"
          type="text"
          value={formData.legalBusinessName}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter legal business name"
        />
      </div>

      <div>
        <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Registration Number
        </label>
        <input
          id="registrationNumber"
          name="registrationNumber"
          type="text"
          value={formData.registrationNumber}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter registration number"
        />
      </div>

      <div>
        <label htmlFor="taxIdentificationNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Tax Identification Number
        </label>
        <input
          id="taxIdentificationNumber"
          name="taxIdentificationNumber"
          type="text"
          value={formData.taxIdentificationNumber}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter tax identification number"
        />
      </div>

      <div>
        <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
          Business Type
        </label>
        <input
          id="businessType"
          name="businessType"
          type="text"
          value={formData.businessType}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter business type"
        />
      </div>

      <div>
        <label htmlFor="industrySector" className="block text-sm font-medium text-gray-700 mb-1">
          Industry Sector
        </label>
        <input
          id="industrySector"
          name="industrySector"
          type="text"
          value={formData.industrySector}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter industry sector"
        />
      </div>

      <div>
        <label htmlFor="dateOfIncorporation" className="block text-sm font-medium text-gray-700 mb-1">
          Date of Incorporation
        </label>
        <input
          id="dateOfIncorporation"
          name="dateOfIncorporation"
          type="date"
          value={formData.dateOfIncorporation}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      <div>
        <label htmlFor="countryOfIncorporation" className="block text-sm font-medium text-gray-700 mb-1">
          Country of Incorporation
        </label>
        <input
          id="countryOfIncorporation"
          name="countryOfIncorporation"
          type="text"
          value={formData.countryOfIncorporation}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter country of incorporation"
        />
      </div>

      <div>
        <label htmlFor="registeredBusinessAddress" className="block text-sm font-medium text-gray-700 mb-1">
          Registered Business Address
        </label>
        <input
          id="registeredBusinessAddress"
          name="registeredBusinessAddress"
          type="text"
          value={formData.registeredBusinessAddress}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter registered business address"
        />
      </div>

      <div>
        <label htmlFor="operatingAddress" className="block text-sm font-medium text-gray-700 mb-1">
          Operating Address
        </label>
        <input
          id="operatingAddress"
          name="operatingAddress"
          type="text"
          value={formData.operatingAddress}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter operating address"
        />
      </div>

      <div>
        <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
          Website URL
        </label>
        <input
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          value={formData.websiteUrl}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter website URL"
        />
      </div>

      <div>
        <label htmlFor="businessBankAccountDetails" className="block text-sm font-medium text-gray-700 mb-1">
          Business Bank Account Details
        </label>
        <input
          id="businessBankAccountDetails"
          name="businessBankAccountDetails"
          type="text"
          value={formData.businessBankAccountDetails}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter bank account details"
        />
      </div>

      <div>
        <label htmlFor="authorizedSignatoryDetails" className="block text-sm font-medium text-gray-700 mb-1">
          Authorized Signatory Details
        </label>
        <input
          id="authorizedSignatoryDetails"
          name="authorizedSignatoryDetails"
          type="text"
          value={formData.authorizedSignatoryDetails}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter authorized signatory details"
        />
      </div>

      <div>
        <label htmlFor="listOfDirectors" className="block text-sm font-medium text-gray-700 mb-1">
          List of Directors
        </label>
        <input
          id="listOfDirectors"
          name="listOfDirectors"
          type="text"
          value={formData.listOfDirectors}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter list of directors"
        />
      </div>

      <div>
        <label htmlFor="ultimateBeneficialOwners" className="block text-sm font-medium text-gray-700 mb-1">
          Ultimate Beneficial Owners
        </label>
        <input
          id="ultimateBeneficialOwners"
          name="ultimateBeneficialOwners"
          type="text"
          value={formData.ultimateBeneficialOwners}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter ultimate beneficial owners"
        />
      </div>

      <div>
        <label htmlFor="shareholdingStructure" className="block text-sm font-medium text-gray-700 mb-1">
          Shareholding Structure
        </label>
        <input
          id="shareholdingStructure"
          name="shareholdingStructure"
          type="text"
          value={formData.shareholdingStructure}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter shareholding structure"
        />
      </div>
    </div>
  );

  const renderBuyerKYBFields = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">KYB / Company Information (Buyer)</h3>
      
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
          Company Name
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          value={formData.companyName}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter company name"
        />
      </div>

      <div>
        <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
          Business Type
        </label>
        <input
          id="businessType"
          name="businessType"
          type="text"
          value={formData.businessType}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter business type"
        />
      </div>

      <div>
        <label htmlFor="industrySector" className="block text-sm font-medium text-gray-700 mb-1">
          Industry Sector
        </label>
        <input
          id="industrySector"
          name="industrySector"
          type="text"
          value={formData.industrySector}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter industry sector"
        />
      </div>

      <div>
        <label htmlFor="businessRegistrationNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Business Registration Number
        </label>
        <input
          id="businessRegistrationNumber"
          name="businessRegistrationNumber"
          type="text"
          value={formData.businessRegistrationNumber}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter business registration number"
        />
      </div>

      <div>
        <label htmlFor="taxIdentificationNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Tax Identification Number
        </label>
        <input
          id="taxIdentificationNumber"
          name="taxIdentificationNumber"
          type="text"
          value={formData.taxIdentificationNumber}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter tax identification number"
        />
      </div>

      <div>
        <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700 mb-1">
          Billing Address
        </label>
        <input
          id="billingAddress"
          name="billingAddress"
          type="text"
          value={formData.billingAddress}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter billing address"
        />
      </div>

      <div>
        <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700 mb-1">
          Shipping Address
        </label>
        <input
          id="shippingAddress"
          name="shippingAddress"
          type="text"
          value={formData.shippingAddress}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter shipping address"
        />
      </div>

      <div>
        <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700 mb-1">
          Company Website
        </label>
        <input
          id="companyWebsite"
          name="companyWebsite"
          type="url"
          value={formData.companyWebsite}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter company website"
        />
      </div>

      <div>
        <label htmlFor="preferredPaymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
          Preferred Payment Method
        </label>
        <select
          id="preferredPaymentMethod"
          name="preferredPaymentMethod"
          value={formData.preferredPaymentMethod}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="">Select payment method</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="credit_card">Credit Card</option>
          <option value="net_banking">Net Banking</option>
          <option value="upi">UPI</option>
          <option value="cheque">Cheque</option>
        </select>
      </div>

      <div>
        <label htmlFor="bankDetails" className="block text-sm font-medium text-gray-700 mb-1">
          Bank Details
        </label>
        <input
          id="bankDetails"
          name="bankDetails"
          type="text"
          value={formData.bankDetails}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter bank details"
        />
      </div>

      <div>
        <label htmlFor="purchaseOrderNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Purchase Order Number
        </label>
        <input
          id="purchaseOrderNumber"
          name="purchaseOrderNumber"
          type="text"
          value={formData.purchaseOrderNumber}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter purchase order number"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-pink-600">Register for Liqwik</h2>
            <p className="text-sm text-gray-600 mt-2">
              Already registered? You can add additional roles using the same credentials.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name <span className="text-pink-600">(Optional)</span>
                </label>
                <input
                  id="middleName"
                  name="middleName"
                  type="text"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter your middle name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Choose a username"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-pink-600">(Optional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Register as <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter organization name"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter organization address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Create a password"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            </div>

            {formData.role === "seller" && renderSellerKYBFields()}
            {formData.role === "buyer" && renderBuyerKYBFields()}
            {formData.role === "seller" && renderBillToPartyFields()}

            {info && (
              <div className="text-blue-600 text-sm text-center bg-blue-50 p-3 rounded-md">{info}</div>
            )}

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">{error}</div>
            )}

            {success && (
              <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">{success}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-pink-600 hover:text-pink-700 font-medium">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}