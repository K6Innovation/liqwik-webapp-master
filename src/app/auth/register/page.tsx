"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    // Organization specific fields
    organizationName: "",
    address: "",
    
    // KYB Fields for Seller
    legalBusinessName: "",
    registrationNumber: "",
    taxIdentificationNumber: "",
    businessType: "",
    industrySector: "",
    dateOfIncorporation: "",
    registrationCertificate: "",
    proofOfAddress: "",
    taxDocument: "",
    ownerIdDocuments: "",
    businessBankAccountDetails: "",
    bankStatementOrCheque: "",
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
    businessLicense: "",
    taxExemptionCertificate: "",
    poAuthorizationLetter: "",
    governmentId: "",
    purchaseOrderNumber: "",
    einvoicingEmail: "",
    accountsPayableContact: "",
    consentForCreditCheck: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Registration successful! Redirecting to email verification...");
        
        // Build the verification URL with all required parameters
        const verifyUrl = `/auth/verify-email?email=${encodeURIComponent(data.email)}&firstName=${encodeURIComponent(data.firstName)}&role=${encodeURIComponent(data.role)}&userRoleId=${encodeURIComponent(data.userRoleId)}`;
        
        console.log("Redirecting to:", verifyUrl); // Debug log
        
        // Use window.location for immediate redirect
        window.location.href = verifyUrl;
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="Enter purchase order number"
        />
      </div>

      <div>
        <label htmlFor="einvoicingEmail" className="block text-sm font-medium text-gray-700 mb-1">
          E-invoicing Contact Email
        </label>
        <input
          id="einvoicingEmail"
          name="einvoicingEmail"
          type="email"
          value={formData.einvoicingEmail}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="Enter e-invoicing contact email"
        />
      </div>

      <div>
        <label htmlFor="accountsPayableContact" className="block text-sm font-medium text-gray-700 mb-1">
          Accounts Payable Contact
        </label>
        <input
          id="accountsPayableContact"
          name="accountsPayableContact"
          type="text"
          value={formData.accountsPayableContact}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="Enter accounts payable contact"
        />
      </div>

      <div className="flex items-center">
        <input
          id="consentForCreditCheck"
          name="consentForCreditCheck"
          type="checkbox"
          checked={formData.consentForCreditCheck}
          onChange={handleInputChange}
          className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
        />
        <label htmlFor="consentForCreditCheck" className="ml-2 block text-sm text-gray-700">
          I consent to credit check
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-pink-600">Register for Liqwik</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter your middle name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Choose a username"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Register as
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name
                  </label>
                  <input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Enter organization name"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Enter organization address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Create a password"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            </div>

            {/* Role-specific KYB Fields */}
            {formData.role === "seller" && renderSellerKYBFields()}
            {formData.role === "buyer" && renderBuyerKYBFields()}

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            {success && (
              <div className="text-green-600 text-sm text-center">{success}</div>
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