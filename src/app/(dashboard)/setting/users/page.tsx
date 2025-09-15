"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUserProfile } from "@/hooks/useUserProfile";
import { isAdmin } from "@/lib/supabase";
import {
  Users, Trash2, Search, AlertCircle, CheckCircle, Loader2
} from "lucide-react";

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === 'object' && err && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    return typeof m === 'string' ? m : fallback;
  }
  return fallback;
};

interface UserRecord {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const { user, userRole } = useUserProfile();
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (userRole && !isAdmin(userRole)) {
      router.replace("/setting");
    }
  }, [userRole, router]);

  // Fetch users
  useEffect(() => {
    if (isAdmin(userRole)) {
      fetchUsers();
    }
  }, [userRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch users'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(userId);
      setError(null);

      // Delete profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      // Remove user from the list
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSuccess('User deleted successfully');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete user'));
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Update user in the list
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      setSuccess('User role updated successfully');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update user role'));
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Don't render if user is not admin
  if (userRole && !isAdmin(userRole)) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <span className="ml-3 text-neutral-500">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-neutral-100 p-2 rounded-lg">
          <Users className="w-6 h-6 text-neutral-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-heading">User Management</h1>
          <p className="text-muted">Manage user accounts and roles (Admin Only)</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700 font-medium">{success}</span>
        </div>
      )}

      {/* Search and Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <span className="text-sm text-neutral-500">
            {filteredUsers.length} of {users.length} users
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredUsers.map((userRecord) => (
                <tr key={userRecord.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-neutral-600">
                            {userRecord.first_name.charAt(0)}{userRecord.last_name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900">
                          {userRecord.first_name} {userRecord.last_name}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {userRecord.role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={userRecord.role}
                      onChange={(e) => handleRoleChange(userRecord.id, e.target.value)}
                      className="text-sm border border-neutral-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={userRecord.id === user?.id} // Can't change own role
                    >
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {new Date(userRecord.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteUser(userRecord.id)}
                      disabled={userRecord.id === user?.id || deleteLoading === userRecord.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      title={userRecord.id === user?.id ? "Cannot delete your own account" : "Delete user"}
                    >
                      {deleteLoading === userRecord.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No users found</h3>
            <p className="text-neutral-500">
              {searchTerm ? `No users match "${searchTerm}"` : "No users have been registered yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
