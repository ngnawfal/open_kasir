import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import AccessDenied from '../components/common/AccessDenied'
import PageLoading from '../components/common/PageLoading'
import UsersToolbar from '../components/users/UsersToolbar'
import UsersSummaryCards from '../components/users/UsersSummaryCards'
import UsersTableSection from '../components/users/UsersTableSection'
import UserFormModal from '../components/users/UserFormModal'
import ResetPasswordModal from '../components/users/ResetPasswordModal'

function UsersPage() {
    const { authFetch, isAdmin } = useAuth()
    const { notify } = useUI()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [showResetPassword, setShowResetPassword] = useState(null)
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        role: 'kasir'
    })
    const [newPassword, setNewPassword] = useState('')

    useEffect(() => {
        if (isAdmin) loadUsers()
    }, [isAdmin])

    const loadUsers = async () => {
        try {
            const response = await authFetch('/api/users')
            if (response.ok) {
                const data = await response.json()
                setUsers(data)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const url = selectedUser
                ? `/api/users/${selectedUser.id}`
                : '/api/users'

            const body = selectedUser
                ? {
                    username: formData.username,
                    full_name: formData.full_name,
                    role: formData.role
                }
                : formData

            const response = await authFetch(url, {
                method: selectedUser ? 'PUT' : 'POST',
                body: JSON.stringify(body)
            })

            if (response.ok) {
                loadUsers()
                resetForm()
            } else {
                const error = await response.json()
                notify({ type: 'error', title: 'Gagal menyimpan user', message: error.detail })
            }
        } catch (error) {
            notify({ type: 'error', title: 'Gagal menyimpan user', message: error.message })
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        try {
            const response = await authFetch(`/api/users/${showResetPassword.id}/reset-password`, {
                method: 'POST',
                body: JSON.stringify({ new_password: newPassword })
            })
            if (response.ok) {
                notify({ type: 'success', title: 'Password direset', message: 'Password user berhasil direset.' })
                setShowResetPassword(null)
                setNewPassword('')
            } else {
                const error = await response.json()
                notify({ type: 'error', title: 'Reset password gagal', message: error.detail })
            }
        } catch (error) {
            notify({ type: 'error', title: 'Reset password gagal', message: error.message })
        }
    }

    const toggleUserStatus = async (user) => {
        try {
            const response = await authFetch(`/api/users/${user.id}`, {
                method: 'PUT',
                body: JSON.stringify({ is_active: !user.is_active })
            })
            if (response.ok) loadUsers()
            else {
                const error = await response.json()
                notify({ type: 'error', title: 'Gagal mengubah status user', message: error.detail })
            }
        } catch (error) {
            notify({ type: 'error', title: 'Gagal mengubah status user', message: error.message })
        }
    }

    const handleEdit = (user) => {
        setSelectedUser(user)
        setFormData({
            username: user.username,
            password: '',
            full_name: user.full_name,
            role: user.role
        })
        setShowForm(true)
    }

    const resetForm = () => {
        setShowForm(false)
        setSelectedUser(null)
        setFormData({ username: '', password: '', full_name: '', role: 'kasir' })
    }

    if (!isAdmin) {
        return <AccessDenied message="Halaman ini hanya untuk Admin" />
    }

    if (loading) {
        return <PageLoading />
    }

    return (
        <div className="page-container admin-page-shell users-page-shell">
            <UsersToolbar setShowForm={setShowForm} />
            <UsersSummaryCards users={users} />
            <UsersTableSection users={users} handleEdit={handleEdit} setShowResetPassword={setShowResetPassword} toggleUserStatus={toggleUserStatus} />
            <UserFormModal showForm={showForm} selectedUser={selectedUser} resetForm={resetForm} handleSubmit={handleSubmit} formData={formData} setFormData={setFormData} />
            <ResetPasswordModal showResetPassword={showResetPassword} setShowResetPassword={setShowResetPassword} handleResetPassword={handleResetPassword} newPassword={newPassword} setNewPassword={setNewPassword} />
        </div>
    )
}

export default UsersPage
