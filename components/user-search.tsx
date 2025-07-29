"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useUserSearch } from "@/hooks/use-user-search";
import { Search, User, X, Loader2 } from "lucide-react";

interface SearchUser {
  user_id: string;
  display_name: string;
  avatar_url?: string;
}

interface UserSearchProps {
  onUserSelect?: (user: SearchUser) => void;
  selectedUsers?: SearchUser[];
  onUserRemove?: (userId: string) => void;
  maxSelections?: number;
  placeholder?: string;
}

export function UserSearch({ 
  onUserSelect, 
  selectedUsers = [],
  onUserRemove,
  maxSelections,
  placeholder = "Search for users to share with..."
}: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { users, loading, error, searchUsers, clearSearch } = useUserSearch();

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      searchUsers(value.trim());
    } else {
      clearSearch();
    }
  };

  const handleUserSelect = (user: SearchUser) => {
    // Check if user is already selected
    if (selectedUsers.find(u => u.user_id === user.user_id)) {
      return;
    }

    // Check max selections limit
    if (maxSelections && selectedUsers.length >= maxSelections) {
      return;
    }

    onUserSelect?.(user);
    setSearchQuery("");
    clearSearch();
  };

  const handleUserRemove = (userId: string) => {
    onUserRemove?.(userId);
  };

  const isUserSelected = (userId: string) => {
    return selectedUsers.some(u => u.user_id === userId);
  };

  const canSelectMore = !maxSelections || selectedUsers.length < maxSelections;

  return (
    <div className="space-y-3">
      {selectedUsers.length > 0 && (
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">
            Selected Users ({selectedUsers.length}{maxSelections ? `/${maxSelections}` : ""})
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <Badge 
                key={user.user_id} 
                variant="secondary" 
                className="flex items-center gap-2 pr-2"
              >
                <div className="flex items-center gap-2">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.display_name}
                      className="w-4 h-4 rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span>{user.display_name}</span>
                </div>
                <button
                  onClick={() => handleUserRemove(user.user_id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {canSelectMore && (
        <div className="space-y-2">
          <Label htmlFor="user-search">Search for users</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="user-search"
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 animate-spin" />
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {searchQuery && users.length > 0 && (
            <div className="border rounded-md bg-background max-h-48 overflow-y-auto">
              {users.map((user) => {
                const isSelected = isUserSelected(user.user_id);
                return (
                  <button
                    key={user.user_id}
                    onClick={() => !isSelected && handleUserSelect(user)}
                    disabled={isSelected}
                    className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted transition-colors border-b last:border-b-0 ${
                      isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.display_name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{user.display_name}</p>
                      {isSelected && (
                        <p className="text-xs text-muted-foreground">Already selected</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {searchQuery && !loading && users.length === 0 && !error && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No users found matching "{searchQuery}"
            </p>
          )}
        </div>
      )}

      {!canSelectMore && maxSelections && (
        <p className="text-sm text-muted-foreground">
          Maximum of {maxSelections} users can be selected.
        </p>
      )}
    </div>
  );
}