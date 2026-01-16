"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { UserProfile, UserRole, OpenHealthcarePersonnelData, OpenMedicalFacilityData, OpenAgencyData, SupportTicket } from "@/lib/types";

// Modals - Open Data (Public Listings)
import OpenHealthcarePersonnelModal from "./components/OpenHealthcarePersonnelModal";
import OpenMedicalFacilityModal from "./components/OpenMedicalFacilityModal";
import OpenAgencyModal from "./components/OpenAgencyModal";

// Modals - User Data (Private Accounts)
import PatientUserModal from "./components/user-data/PatientUserModal";
import HealthcarePersonnelUserModal from "./components/user-data/HealthcarePersonnelUserModal";
import MedicalFacilityUserModal from "./components/user-data/MedicalFacilityUserModal";
import AgencyUserModal from "./components/user-data/AgencyUserModal";

type AdminTab = 'all_users' | 'personnel' | 'facilities' | 'agencies' | 'patients' | 'open_personnel' | 'open_facilities' | 'open_agencies' | 'tickets';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('all_users');
  const [loading, setLoading] = useState(true);
  
  // Modal States - Open Data
  const [isOpenPersonnelModalOpen, setIsOpenPersonnelModalOpen] = useState(false);
  const [isOpenFacilityModalOpen, setIsOpenFacilityModalOpen] = useState(false);
  const [isOpenAgencyModalOpen, setIsOpenAgencyModalOpen] = useState(false);

  // Modal States - User Data
  const [isPatientUserModalOpen, setIsPatientUserModalOpen] = useState(false);
  const [isPersonnelUserModalOpen, setIsPersonnelUserModalOpen] = useState(false);
  const [isFacilityUserModalOpen, setIsFacilityUserModalOpen] = useState(false);
  const [isAgencyUserModalOpen, setIsAgencyUserModalOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedOpenData, setSelectedOpenData] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [openData, setOpenData] = useState<{
    personnel: OpenHealthcarePersonnelData[];
    facilities: OpenMedicalFacilityData[];
    agencies: OpenAgencyData[];
  }>({
    personnel: [],
    facilities: [],
    agencies: []
  });
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList = usersSnap.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id,
      } as UserProfile));
      setUsers(usersList);

      // Also fetch all open data and support tickets
      const [personnelSnap, facilitiesSnap, agenciesSnap, ticketsSnap] = await Promise.all([
        getDocs(collection(db, "open_healthcare_personnel_data")),
        getDocs(collection(db, "open_medical_facility_data")),
        getDocs(collection(db, "open_agency_data")),
        getDocs(collection(db, "support_tickets"))
      ]);

      setOpenData({
        personnel: personnelSnap.docs.map(d => ({ id: d.id, ...d.data() } as OpenHealthcarePersonnelData)),
        facilities: facilitiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as OpenMedicalFacilityData)),
        agencies: agenciesSnap.docs.map(d => ({ id: d.id, ...d.data() } as OpenAgencyData))
      });

      setTickets(ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket)));

    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const tabs: { id: AdminTab; label: string; icon: string; category: string }[] = [
    { id: 'patients', label: 'Patients', icon: '👤', category: 'Users' },
    { id: 'facilities', label: 'Facilities', icon: '🏥', category: 'Users' },
    { id: 'personnel', label: 'Personnel', icon: '🩺', category: 'Users' },
    { id: 'agencies', label: 'Agencies', icon: '✈️', category: 'Users' },
    { id: 'all_users', label: 'All Users', icon: '👥', category: 'Users' },
    { id: 'open_personnel', label: 'Personnel Open Data', icon: '🌐', category: 'Directory' },
    { id: 'open_facilities', label: 'Facility Open Data', icon: '🏢', category: 'Directory' },
    { id: 'open_agencies', label: 'Agency Open Data', icon: '🌍', category: 'Directory' },
    { id: 'tickets', label: 'Tickets', icon: '🎫', category: 'Support' },
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
                <th className="p-4 text-sm">Status</th>
                <th className="p-4 text-sm">Created</th>
                <th className="p-4 text-right text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {users.map(user => (
                <tr key={user.uid} className="hover:bg-zinc-800/50">
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
                    {user.role === 'patient' && (
                      <button onClick={() => { setSelectedUser(user); setIsPatientUserModalOpen(true); }} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold uppercase">Edit</button>
                    )}
                    {user.role === 'healthcare_personnel' && (
                      <button onClick={() => { setSelectedUser(user); setIsPersonnelUserModalOpen(true); }} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold uppercase">Edit</button>
                    )}
                    {user.role === 'medical_facility' && (
                      <button onClick={() => { setSelectedUser(user); setIsFacilityUserModalOpen(true); }} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold uppercase">Edit</button>
                    )}
                    {user.role === 'agency' && (
                      <button onClick={() => { setSelectedUser(user); setIsAgencyUserModalOpen(true); }} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold uppercase">Edit</button>
                    )}
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
    const personnelUsers = users.filter(u => u.role === 'healthcare_personnel' || u.personalHealthcarePersonnelData);
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 bg-zinc-900/50 rounded-lg border border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Healthcare Personnel Profiles</h3>
            <p className="text-xs text-zinc-500">{personnelUsers.length} total users</p>
          </div>
          <button 
            onClick={() => {
              setSelectedUser(null);
              setIsPersonnelUserModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors"
          >
            + Create New Personnel
          </button>
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
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {personnelUsers.map(user => (
              <tr key={user.uid} className="hover:bg-zinc-800/50">
                <td className="p-4">
                  <div className="font-medium">{user.personalHealthcarePersonnelData?.name || user.displayName}</div>
                  <div className="text-xs text-zinc-500">{user.email}</div>
                </td>
                <td className="p-4 text-[10px] font-bold uppercase text-zinc-400">
                  {user.personalHealthcarePersonnelData?.personnelType || 'N/A'}
                </td>
                <td className="p-4 text-sm">{user.personalHealthcarePersonnelData?.specialization || 'N/A'}</td>
                <td className="p-4 text-xs text-zinc-500">{user.personalHealthcarePersonnelData?.city || 'N/A'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${user.personalHealthcarePersonnelData?.verified ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {user.personalHealthcarePersonnelData?.verified ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => {
                      setSelectedUser(user);
                      setIsPersonnelUserModalOpen(true);
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
    const facilityUsers = users.filter(u => u.role === 'medical_facility' || u.personalMedicalFacilityData);
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 bg-zinc-900/50 rounded-lg border border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Medical Facility Profiles</h3>
            <p className="text-xs text-zinc-500">{facilityUsers.length} total users</p>
          </div>
          <button 
            onClick={() => {
              setSelectedUser(null);
              setIsFacilityUserModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors"
          >
            + Create New Facility
          </button>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
          <thead className="bg-zinc-800 text-zinc-400 text-sm">
            <tr>
              <th className="p-4">Facility Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Location</th>
              <th className="p-4">Verified</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {facilityUsers.map(user => (
              <tr key={user.uid} className="hover:bg-zinc-800/50">
                <td className="p-4">
                  <div className="font-medium">{user.personalMedicalFacilityData?.name || user.displayName}</div>
                  <div className="text-xs text-zinc-500">{user.email}</div>
                </td>
                <td className="p-4 text-[10px] font-bold uppercase text-zinc-400">
                  {user.personalMedicalFacilityData?.facilityType || 'N/A'}
                </td>
                <td className="p-4 text-xs text-zinc-500">
                  {user.personalMedicalFacilityData?.city || 'N/A'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${user.personalMedicalFacilityData?.verified ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {user.personalMedicalFacilityData?.verified ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => {
                      setSelectedUser(user);
                      setIsFacilityUserModalOpen(true);
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
    const agencyUsers = users.filter(u => u.role === 'agency' || u.personalAgencyData);
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 bg-zinc-900/50 rounded-lg border border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Agency Profiles</h3>
            <p className="text-xs text-zinc-500">{agencyUsers.length} total users</p>
          </div>
          <button 
            onClick={() => {
              setSelectedUser(null);
              setIsAgencyUserModalOpen(true);
            }}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-bold transition-colors"
          >
            + Create New Agency
          </button>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
          <thead className="bg-zinc-800 text-zinc-400 text-sm">
            <tr>
              <th className="p-4">Agency Name</th>
              <th className="p-4">Location</th>
              <th className="p-4">Verified</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {agencyUsers.map(user => (
              <tr key={user.uid} className="hover:bg-zinc-800/50">
                <td className="p-4">
                  <div className="font-medium">{user.personalAgencyData?.name || user.displayName}</div>
                  <div className="text-xs text-zinc-500">{user.email}</div>
                </td>
                <td className="p-4 text-xs text-zinc-500">
                  {user.personalAgencyData?.city}, {user.personalAgencyData?.country}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${user.personalAgencyData?.verified ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {user.personalAgencyData?.verified ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => {
                      setSelectedUser(user);
                      setIsAgencyUserModalOpen(true);
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
            {patientUsers.map(user => (
              <tr key={user.uid} className="hover:bg-zinc-800/50">
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
                      setIsPatientUserModalOpen(true);
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
            <h3 className="text-xl font-semibold text-blue-400">Personnel Open Data Listing</h3>
            <p className="text-xs text-zinc-500">{openData.personnel.length} listings</p>
          </div>
          <button 
            onClick={() => {
              setSelectedOpenData(null);
              setModalMode('create');
              setIsOpenPersonnelModalOpen(true);
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
                <th className="p-4 text-left">Specialization</th>
                <th className="p-4">Owner ID</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {openData.personnel.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/50">
                  <td className="p-4">
                    <div className="font-medium text-blue-400">{item.name}</div>
                    <div className="text-xs text-zinc-500">{item.slug}</div>
                  </td>
                  <td className="p-4 text-[10px] font-bold uppercase text-zinc-400">
                    {item.personnelType || 'N/A'}
                  </td>
                  <td className="p-4 text-sm">{item.specialization || 'N/A'}</td>
                  <td className="p-4 text-xs font-mono text-zinc-500">
                    {item.personalHealthcarePersonnelDataId || 'Unlinked'}
                  </td>
                  <td className="p-4 text-xs text-zinc-500">
                    {item.createdAt ? new Date((item.createdAt as any).seconds * 1000).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedOpenData(item);
                        setModalMode('edit');
                        setIsOpenPersonnelModalOpen(true);
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
            <h3 className="text-xl font-semibold text-green-400">Facility Open Data Listing</h3>
            <p className="text-xs text-zinc-500">{openData.facilities.length} listings</p>
          </div>
          <button 
            onClick={() => {
              setSelectedOpenData(null);
              setModalMode('create');
              setIsOpenFacilityModalOpen(true);
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
              {openData.facilities.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/50">
                  <td className="p-4">
                    <div className="font-medium text-green-400">{item.name}</div>
                    <div className="text-xs text-zinc-500">{item.slug}</div>
                  </td>
                  <td className="p-4 text-[10px] font-bold uppercase text-zinc-400">
                    {item.facilityType || 'N/A'}
                  </td>
                  <td className="p-4 text-sm">{item.city}, {item.country}</td>
                  <td className="p-4 text-xs font-mono text-zinc-500">
                    {item.personalMedicalFacilityDataId || 'Unlinked'}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedOpenData(item);
                        setModalMode('edit');
                        setIsOpenFacilityModalOpen(true);
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
            <h3 className="text-xl font-semibold text-orange-400">Agency Open Data Listing</h3>
            <p className="text-xs text-zinc-500">{openData.agencies.length} listings</p>
          </div>
          <button 
            onClick={() => {
              setSelectedOpenData(null);
              setModalMode('create');
              setIsOpenAgencyModalOpen(true);
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
              {openData.agencies.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/50">
                  <td className="p-4">
                    <div className="font-medium text-purple-400">{item.name}</div>
                    <div className="text-xs text-zinc-500">{item.slug}</div>
                  </td>
                  <td className="p-4 text-sm">{item.country || 'N/A'}</td>
                  <td className="p-4 text-xs font-mono text-zinc-500">
                    {item.personalAgencyDataId || 'Unlinked'}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedOpenData(item);
                        setModalMode('edit');
                        setIsOpenAgencyModalOpen(true);
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
      case 'open_personnel': return renderOpenPersonnelTab();
      case 'open_facilities': return renderOpenFacilitiesTab();
      case 'open_agencies': return renderOpenAgenciesTab();
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
                {tabs.filter(t => t.category === 'Users').map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'border-blue-500 text-blue-500 bg-blue-500/5' 
                        : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2">Public Directory</span>
              <div className="flex border-b border-zinc-900 overflow-x-auto">
                {tabs.filter(t => t.category === 'Directory').map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'border-green-500 text-green-500 bg-green-500/5' 
                        : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex border-b border-zinc-900 overflow-x-auto">
                {tabs.filter(t => t.category === 'Support').map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'border-zinc-500 text-white bg-zinc-500/5' 
                        : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
            </div>
          </div>

          {/* Tab Content */}
          {renderContent()}

          {/* Modals */}
          {/* User Data Modals (Private Accounts) */}
          {selectedUser && (
            <>
              <PatientUserModal
                isOpen={isPatientUserModalOpen}
                onClose={() => setIsPatientUserModalOpen(false)}
                user={selectedUser}
                onSuccess={fetchUsers}
              />
              <HealthcarePersonnelUserModal
                isOpen={isPersonnelUserModalOpen}
                onClose={() => setIsPersonnelUserModalOpen(false)}
                user={selectedUser}
                onSuccess={fetchUsers}
              />
              <MedicalFacilityUserModal
                isOpen={isFacilityUserModalOpen}
                onClose={() => setIsFacilityUserModalOpen(false)}
                user={selectedUser}
                onSuccess={fetchUsers}
              />
              <AgencyUserModal
                isOpen={isAgencyUserModalOpen}
                onClose={() => setIsAgencyUserModalOpen(false)}
                user={selectedUser}
                onSuccess={fetchUsers}
              />
            </>
          )}

          {/* Open Data Modals (Public Listings) */}
          <OpenHealthcarePersonnelModal
            isOpen={isOpenPersonnelModalOpen}
            onClose={() => setIsOpenPersonnelModalOpen(false)}
            openDataRecord={selectedOpenData}
            mode={modalMode}
            onSuccess={fetchUsers}
          />

          <OpenMedicalFacilityModal
            isOpen={isOpenFacilityModalOpen}
            onClose={() => setIsOpenFacilityModalOpen(false)}
            openDataRecord={selectedOpenData}
            mode={modalMode}
            onSuccess={fetchUsers}
          />

          <OpenAgencyModal
            isOpen={isOpenAgencyModalOpen}
            onClose={() => setIsOpenAgencyModalOpen(false)}
            openDataRecord={selectedOpenData}
            mode={modalMode}
            onSuccess={fetchUsers}
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
