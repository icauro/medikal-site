"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { UserProfile, UserRole, HealthcarePersonnelListing, MedicalFacilityListing, AgencyListing, SupportTicket } from "@/lib/types";
import { supabase } from "@/lib/supabase";

// Modals
import UserCRUDModal from "./components/user-data/UserCRUDModal";
import AgencyListingCRUDModal from "./components/AgencyListingCRUDModal";
import HealthcarePersonnelListingCRUDModal from "./components/HealthcarePersonnelListingCRUDModal";
import MedicalFacilityListingCRUDModal from "./components/MedicalFacilityListingCRUDModal";

type AdminTab = 'all_users' | 'personnel' | 'facilities' | 'agencies' | 'patients' | 'personnel_listings' | 'facility_listings' | 'agency_listings' | 'tickets';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('all_users');
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedOpenData, setSelectedOpenData] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [openData, setOpenData] = useState<{
    personnel: HealthcarePersonnelListing[];
    facilities: MedicalFacilityListing[];
    agencies: AgencyListing[];
  }>({
    personnel: [],
    facilities: [],
    agencies: []
  });
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch listings first (public read access)
      const [personnelRes, facilitiesRes, agenciesRes] = await Promise.all([
        supabase.from('healthcare_personnel_listings').select('*'),
        supabase.from('medical_facility_listings').select('*'),
        supabase.from('agency_listings').select('*')
      ]);

      setOpenData({
        personnel: personnelRes.data || [],
        facilities: facilitiesRes.data || [],
        agencies: agenciesRes.data || []
      });

      // Fetch users and tickets (requires admin permission)
      const [usersRes, ticketsRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('support_tickets').select('*')
      ]);

      setUsers(usersRes.data || []);
      setTickets(ticketsRes.data || []);

      if (usersRes.error) {
        console.error("🚫 [ADMIN] Error fetching users:", usersRes.error);
      }
      if (ticketsRes.error) {
        console.error("🚫 [ADMIN] Error fetching tickets:", ticketsRes.error);
      }

    } catch (error) {
      console.error("🚫 [ADMIN] Error fetching admin data:", error);
      // If permission denied, user might not be an admin yet
      if (error instanceof Error && error.message.includes('permission')) {
        console.error("⚠️ [ADMIN] Permission denied - ensure you have admin role in your user profile");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const tabs: { id: AdminTab; label: string; icon: string; category: string; color?: string }[] = [
    { id: 'all_users', label: 'All Users', icon: '👥', category: 'Users', color: 'zinc' },
    { id: 'patients', label: 'Patients', icon: '👤', category: 'Users', color: 'zinc' },
    { id: 'personnel', label: 'Personnel', icon: '🩺', category: 'Users', color: 'blue' },
    { id: 'facilities', label: 'Facilities', icon: '🏥', category: 'Users', color: 'emerald' },
    { id: 'agencies', label: 'Agencies', icon: '✈️', category: 'Users', color: 'orange' },
    { id: 'personnel_listings', label: 'Personnel', icon: '🩺', category: 'Listings', color: 'blue' },
    { id: 'facility_listings', label: 'Facilities', icon: '🏥', category: 'Listings', color: 'emerald' },
    { id: 'agency_listings', label: 'Agencies', icon: '✈️', category: 'Listings', color: 'orange' },
    { id: 'tickets', label: 'Tickets', icon: '🎫', category: 'Support', color: 'amber' },
  ];

  const renderAllUsersTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 px-4 py-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
            <h3 className="text-xl font-semibold text-blue-400">All System Users</h3>
            <p className="text-xs text-zinc-500">{users.length} total users in system</p>
          </div>
          <div className="px-4 py-3 bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Quick Filter</span>
              <select className="bg-transparent text-sm font-medium outline-none text-zinc-300">
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="pending">Pending Only</option>
              </select>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="flex-1 min-w-[200px]">
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                className="w-full bg-zinc-800/50 border border-zinc-800 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-800 text-zinc-400 text-sm">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">No users found</td>
                </tr>
              ) : users.map(user => (
                <tr key={user.id} className="hover:bg-zinc-800/50">
                  <td className="p-4">
                    <div className="font-medium">{user.displayName || 'Unnamed'}</div>
                    <div className="text-xs text-zinc-500">{user.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-tighter">
                      {user.role?.replace('_', ' ') || 'No Role'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      user.accountStatus === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {user.accountStatus || 'Pending'}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-zinc-500">
                    {user.createdAt ? new Date((user.createdAt as any).seconds * 1000).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => { 
                        setSelectedUser(user); 
                        setIsUserModalOpen(true); 
                      }} 
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold uppercase transition-colors"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPersonnelTab = () => {
    const personnelUsers = users.filter(u => u.role === 'healthcare_personnel' || u.healthcarePersonnelAccountData);
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 bg-zinc-900/50 rounded-lg border border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Healthcare Personnel Profiles</h3>
            <p className="text-xs text-zinc-500">{personnelUsers.length} total users</p>
          </div>
          {/* Modal removed - create disabled
          <button 
            onClick={() => {
              setSelectedUser(null);
              setSelectedOpenData(null);
              setModalMode('create');
              setIsPersonnelModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors"
          >
            + Create New Personnel
          </button>
          */}
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
          <thead className="bg-zinc-800 text-zinc-400 text-sm">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Specialization</th>
              <th className="p-4">Location</th>
              <th className="p-4">Verified</th>
              <th className="p-4">Published</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {personnelUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-zinc-500">No healthcare personnel found</td>
              </tr>
            ) : personnelUsers.map(user => (
              <tr key={user.id} className="hover:bg-zinc-800/50">
                <td className="p-4">
                  <div className="font-medium">{user.healthcarePersonnelAccountData?.name || user.displayName}</div>
                  <div className="text-xs text-zinc-500">{user.email}</div>
                </td>
                <td className="p-4 text-[10px] font-bold uppercase text-zinc-400">
                  {user.healthcarePersonnelAccountData?.personnelType || 'N/A'}
                </td>
                <td className="p-4 text-sm">{user.healthcarePersonnelAccountData?.specialization || 'N/A'}</td>
                <td className="p-4 text-sm">
                  {user.healthcarePersonnelAccountData?.province && user.healthcarePersonnelAccountData?.country 
                    ? `${user.healthcarePersonnelAccountData.province}, ${user.healthcarePersonnelAccountData.country}` 
                    : 'N/A'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${user.healthcarePersonnelAccountData?.verifiedAt ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {user.healthcarePersonnelAccountData?.verifiedAt ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${user.healthcarePersonnelAccountData?.listingId ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                    {user.healthcarePersonnelAccountData?.listingId ? 'Linked' : 'Not Linked'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => {
                      setSelectedUser(user);
                      setIsUserModalOpen(true);
                    }}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold uppercase transition-colors"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
     </div>
    );
  };

  const renderFacilitiesTab = () => {
    const facilityUsers = users.filter(u => u.role === 'medical_facility' || u.medicalFacilityAccountData);
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 bg-zinc-900/50 rounded-lg border border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Medical Facility Profiles</h3>
            <p className="text-xs text-zinc-500">{facilityUsers.length} total users</p>
          </div>
          {/* Modal removed - create disabled
          <button 
            onClick={() => {
              setSelectedUser(null);
              setSelectedOpenData(null);
              setModalMode('create');
              setIsFacilityModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors"
          >
            + Create New Facility
          </button>
          */}
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
          <thead className="bg-zinc-800 text-zinc-400 text-sm">
            <tr>
              <th className="p-4">Facility Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Location</th>
              <th className="p-4">Verified</th>
              <th className="p-4">Published</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {facilityUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">No medical facilities found</td>
              </tr>
            ) : facilityUsers.map(user => (
              <tr key={user.id} className="hover:bg-zinc-800/50">
                <td className="p-4">
                  <div className="font-medium">{user.medicalFacilityAccountData?.name || user.displayName}</div>
                  <div className="text-xs text-zinc-500">{user.email}</div>
                </td>
                <td className="p-4 text-[10px] font-bold uppercase text-zinc-400">
                  {user.medicalFacilityAccountData?.facilityType || 'N/A'}
                </td>
                <td className="p-4 text-sm">
                  {user.medicalFacilityAccountData?.province && user.medicalFacilityAccountData?.country 
                    ? `${user.medicalFacilityAccountData.province}, ${user.medicalFacilityAccountData.country}` 
                    : 'N/A'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${user.medicalFacilityAccountData?.verifiedAt ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {user.medicalFacilityAccountData?.verifiedAt ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${user.medicalFacilityAccountData?.listingId ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                    {user.medicalFacilityAccountData?.listingId ? 'Linked' : 'Not Linked'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => {
                      setSelectedUser(user);
                      setIsUserModalOpen(true);
                    }}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold uppercase transition-colors"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
     </div>
    );
  };

  const renderAgenciesTab = () => {
    const agencyUsers = users.filter(u => u.role === 'agency' || u.agencyAccountData);
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 bg-zinc-900/50 rounded-lg border border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Agency Profiles</h3>
            <p className="text-xs text-zinc-500">{agencyUsers.length} total users</p>
          </div>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
          <thead className="bg-zinc-800 text-zinc-400 text-sm">
            <tr>
              <th className="p-4">Agency Name</th>
              <th className="p-4">Location</th>
              <th className="p-4">Verified</th>
              <th className="p-4">Published</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {agencyUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">No agencies found</td>
              </tr>
            ) : agencyUsers.map(user => (
              <tr key={user.id} className="hover:bg-zinc-800/50">
                <td className="p-4">
                  <div className="font-medium">{user.agencyAccountData?.name || user.displayName}</div>
                  <div className="text-xs text-zinc-500">{user.email}</div>
                </td>
                <td className="p-4 text-sm">
                  {user.agencyAccountData?.province && user.agencyAccountData?.country 
                    ? `${user.agencyAccountData.province}, ${user.agencyAccountData.country}` 
                    : 'N/A'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${user.agencyAccountData?.verified ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {user.agencyAccountData?.verified ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${user.agencyAccountData?.listingId ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                    {user.agencyAccountData?.listingId ? 'Linked' : 'Not Linked'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => {
                      setSelectedUser(user);
                      setIsUserModalOpen(true);
                    }}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold uppercase transition-colors"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
     </div>
    );
  };

  const renderPatientsTab = () => {
    const patientUsers = users.filter(u => u.role === 'patient');
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
          <h3 className="text-xl font-semibold">Patient Profiles</h3>
          <p className="text-xs text-zinc-500">{patientUsers.length} total users</p>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
          <thead className="bg-zinc-800 text-zinc-400 text-sm">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {patientUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">No patients found</td>
              </tr>
            ) : patientUsers.map(user => (
              <tr key={user.id} className="hover:bg-zinc-800/50">
                <td className="p-4 font-medium">{user.displayName || 'Unnamed User'}</td>
                <td className="p-4 text-sm text-zinc-400">{user.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    user.accountStatus === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {user.accountStatus || 'Pending'}
                  </span>
                </td>
                <td className="p-4 text-xs text-zinc-500">
                  {user.createdAt ? new Date((user.createdAt as any).seconds * 1000).toLocaleDateString() : 'N/A'}
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => {
                      setSelectedUser(user);
                      setIsUserModalOpen(true);
                    }}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold uppercase transition-colors"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
     </div>
    );
  };

  const renderOpenPersonnelTab = () => {
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 bg-zinc-900/50 rounded-lg border border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-blue-400">Personnel Listings</h3>
            <p className="text-xs text-zinc-500">{openData.personnel.length} listings</p>
          </div>
          {/* Modal removed - create disabled */}
          <button
            onClick={() => {
              setSelectedUser(null);
              setSelectedOpenData(null);
              setModalMode('create');
              setIsPersonnelModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors"
          >
            + New Listing
          </button>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-800 text-zinc-400 text-sm">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Specialty</th>
                <th className="p-4">Location</th>
                <th className="p-4">Owner ID</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {openData.personnel.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">No personnel listings found</td>
                </tr>
              ) : openData.personnel.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/50">
                  <td className="p-4">
                    <div className="font-medium text-blue-400">{item.name}</div>
                    <div className="text-xs text-zinc-500">{item.slug}</div>
                  </td>
                  <td className="p-4 text-[10px] font-bold uppercase text-zinc-400">
                    {item.personnelType || 'N/A'}
                  </td>
                  <td className="p-4 text-sm">{item.specialization || 'N/A'}</td>
                  <td className="p-4 text-sm">{item.country}</td>
                  <td className="p-4 text-xs font-mono text-zinc-500">
                    {item.userId || 'Unlinked'}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                      setSelectedUser(users.find(u => u.id === item.userId) || null);
                        setSelectedOpenData(item);
                        setModalMode('edit');
                        setIsPersonnelModalOpen(true);
                      }}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold uppercase transition-colors"
                    >
                      Edit Listing
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOpenFacilitiesTab = () => {
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 bg-zinc-900/50 rounded-lg border border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-green-400">Facility Listings</h3>
            <p className="text-xs text-zinc-500">{openData.facilities.length} listings</p>
          </div>
          {/* Modal removed - create disabled */}
          <button
            onClick={() => {
              setSelectedUser(null);
              setSelectedOpenData(null);
              setModalMode('create');
              setIsFacilityModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors"
          >
            + New Listing
          </button>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-800 text-zinc-400 text-sm">
              <tr>
                <th className="p-4">Facility Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Location</th>
                <th className="p-4">Owner ID</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {openData.facilities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">No facility listings found</td>
                </tr>
              ) : openData.facilities.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/50">
                  <td className="p-4">
                    <div className="font-medium text-green-400">{item.name}</div>
                    <div className="text-xs text-zinc-500">{item.slug}</div>
                  </td>
                  <td className="p-4 text-[10px] font-bold uppercase text-zinc-400">
                    {item.facilityType || 'N/A'}
                  </td>
                  <td className="p-4 text-sm">{item.province}, {item.country}</td>
                  <td className="p-4 text-xs font-mono text-zinc-500">
                    {item.userId || 'Unlinked'}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedUser(users.find(u => u.id === item.userId) || null);
                        setSelectedOpenData(item);
                        setModalMode('edit');
                        setIsFacilityModalOpen(true);
                      }}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold uppercase transition-colors"
                    >
                      Edit Listing
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOpenAgenciesTab = () => {
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 bg-zinc-900/50 rounded-lg border border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-orange-400">Agency Listings</h3>
            <p className="text-xs text-zinc-500">{openData.agencies.length} listings</p>
          </div>
          <button 
            onClick={() => {
              setSelectedUser(null);
              setSelectedOpenData(null);
              setModalMode('create');
              setIsAgencyModalOpen(true);
            }}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-bold transition-colors"
          >
            + New Listing
          </button>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-800 text-zinc-400 text-sm">
              <tr>
                <th className="p-4">Agency Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Owner ID</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {openData.agencies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">No agency listings found</td>
                </tr>
              ) : openData.agencies.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/50">
                  <td className="p-4">
                    <div className="font-medium text-orange-400">{item.name}</div>
                    <div className="text-xs text-zinc-500">{item.slug}</div>
                  </td>
                  <td className="p-4 text-sm">{item.province}, {item.country}</td>
                  <td className="p-4 text-xs font-mono text-zinc-500">
                    {item.userId || 'Unlinked'}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedUser(users.find(u => u.id === item.userId) || null);
                        setSelectedOpenData(item);
                        setModalMode('edit');
                        setIsAgencyModalOpen(true);
                      }}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold uppercase transition-colors"
                    >
                      Edit Listing
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTicketsTab = () => {
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 bg-zinc-900/50 rounded-lg border border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-amber-400">Support Tickets</h3>
            <p className="text-xs text-zinc-500">{tickets.length} total tickets from users</p>
          </div>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-800 text-zinc-400 text-sm">
              <tr>
                <th className="p-4">Subject</th>
                <th className="p-4">User</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">No support tickets found</td>
                </tr>
              ) : (
                tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-zinc-800/50">
                    <td className="p-4">
                      <div className="font-medium">{ticket.subject}</div>
                      <div className="text-[10px] uppercase font-bold text-zinc-500">{ticket.category}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium">{ticket.userName}</div>
                      <div className="text-xs text-zinc-500">{ticket.userEmail}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        ticket.priority === 'urgent' ? 'bg-red-500/10 text-red-500' :
                        ticket.priority === 'high' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        ticket.status === 'open' ? 'bg-green-500/10 text-green-500' :
                        ticket.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-zinc-500/10 text-zinc-400'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-zinc-500">
                      {ticket.createdAt ? new Date((ticket.createdAt as any).seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        href={`/support/tickets/${ticket.id}`}
                        className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold uppercase transition-colors"
                      >
                        View Thread
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) return <div className="p-8 text-center text-zinc-400">Loading data...</div>;
    
    switch (activeTab) {
      case 'all_users': return renderAllUsersTab();
      case 'personnel': return renderPersonnelTab();
      case 'facilities': return renderFacilitiesTab();
      case 'agencies': return renderAgenciesTab();
      case 'patients': return renderPatientsTab();
      case 'personnel_listings': return renderOpenPersonnelTab();
      case 'facility_listings': return renderOpenFacilitiesTab();
      case 'agency_listings': return renderOpenAgenciesTab();
      case 'tickets': return renderTicketsTab();
      default: return null;
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-zinc-400">Unified management for all medical entities</p>
            </div>
            <div className="flex gap-4 items-center">
               <button onClick={fetchUsers} className="text-sm text-zinc-400 hover:text-white transition-colors">
                 Refresh Data
               </button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Patients</div>
              <div className="text-2xl font-bold text-white">{users.filter(u => u.role === 'patient').length}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl border-l-4 border-l-blue-500">
              <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Active Personnel</div>
              <div className="text-2xl font-bold text-blue-400">{users.filter(u => u.role === 'healthcare_personnel').length}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl border-l-4 border-l-emerald-500">
              <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Medical Facilities</div>
              <div className="text-2xl font-bold text-emerald-400">{users.filter(u => u.role === 'medical_facility').length}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl border-l-4 border-l-orange-500">
              <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Agencies</div>
              <div className="text-2xl font-bold text-orange-400">{users.filter(u => u.role === 'agency').length}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl border-l-4 border-l-amber-500">
              <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Open Tickets</div>
              <div className="text-2xl font-bold text-amber-400">{tickets.filter(t => t.status === 'open').length}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="space-y-6 mb-8">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2">Account Database</span>
              <div className="flex border-b border-zinc-900 overflow-x-auto">
                {tabs.filter(t => t.category === 'Users').map(tab => {
                  const color = tab.color || 'blue';
                  return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap w-[140px] justify-center ${
                      activeTab === tab.id 
                        ? `border-${color}-500 text-${color}-500 bg-${color}-500/5` 
                        : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                )})}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2">Public Listings</span>
              <div className="flex border-b border-zinc-900 overflow-x-auto">
                {/* Spacers to align with Account Database tabs above (All Users + Patients = 2 × 140px) */}
                <div className="flex-shrink-0" style={{ width: '140px' }}></div>
                <div className="flex-shrink-0" style={{ width: '140px' }}></div>
                {tabs.filter(t => t.category === 'Listings').map(tab => {
                  const color = tab.color || 'green';
                  return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap w-[140px] justify-center ${
                      activeTab === tab.id 
                        ? `border-${color}-500 text-${color}-500 bg-${color}-500/5` 
                        : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                )})}
              </div>
            </div>

            {/* Horizontal Separator */}
            <div className="border-t border-zinc-800 my-6"></div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2">Customer Support</span>
              <div className="flex border-b border-zinc-900 overflow-x-auto">
                {tabs.filter(t => t.category === 'Support').map(tab => {
                  const color = tab.color || 'amber';
                  return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap w-[140px] justify-center ${
                      activeTab === tab.id 
                        ? `border-${color}-500 text-${color}-500 bg-${color}-500/5` 
                        : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                )})}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {renderContent()}

          {/* Modals */}
          {selectedUser && (
            <UserCRUDModal
              isOpen={isUserModalOpen}
              onClose={() => setIsUserModalOpen(false)}
              user={selectedUser}
              onSuccess={() => {
                setIsUserModalOpen(false);
                fetchUsers();
              }}
            />
          )}

          <AgencyListingCRUDModal
            isOpen={isAgencyModalOpen}
            onClose={() => setIsAgencyModalOpen(false)}
            openDataRecord={selectedOpenData}
            mode={modalMode}
            onSuccess={() => {
              setIsAgencyModalOpen(false);
              fetchUsers();
            }}
          />

          <HealthcarePersonnelListingCRUDModal
            isOpen={isPersonnelModalOpen}
            onClose={() => setIsPersonnelModalOpen(false)}
            openDataRecord={selectedOpenData}
            mode={modalMode}
            onSuccess={() => {
              setIsPersonnelModalOpen(false);
              fetchUsers();
            }}
          />

          <MedicalFacilityListingCRUDModal
            isOpen={isFacilityModalOpen}
            onClose={() => setIsFacilityModalOpen(false)}
            openDataRecord={selectedOpenData}
            mode={modalMode}
            onSuccess={() => {
              setIsFacilityModalOpen(false);
              fetchUsers();
            }}
          />

          {/* Navigation Back */}
          <div className="mt-8">
            <Link
              href="/"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
