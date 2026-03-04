"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, User } from "lucide-react";
import { updateProfile, deleteAccount } from "@/lib/actions";
import { UploadButton } from "@/lib/uploadthing-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ProfileData = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  role: string;
  createdAt: Date;
};

export function ProfileForm({ initialData }: { initialData: ProfileData }) {
  const [imageUrl, setImageUrl] = useState(initialData.image ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [state, formAction, isPending] = useActionState(updateProfile, null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your profile details below.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <input type="hidden" name="image" value={imageUrl} />
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted flex items-center justify-center border">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <UploadButton
                  endpoint="profileImage"
                  onUploadBegin={() => setIsUploading(true)}
                  onClientUploadComplete={(res) => {
                    setIsUploading(false);
                    if (res[0]?.ufsUrl) {
                      setImageUrl(res[0].ufsUrl);
                    }
                  }}
                  onUploadError={() => setIsUploading(false)}
                  appearance={{
                    button:
                      "bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2",
                    allowedContent: "text-xs text-muted-foreground",
                  }}
                  content={{
                    button: isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Photo
                      </>
                    ),
                  }}
                />
                {imageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setImageUrl("")}
                  >
                    Remove photo
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={initialData.name ?? ""}
                placeholder="Your name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={initialData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                defaultValue={initialData.bio ?? ""}
                placeholder="Tell us a little about yourself"
                rows={3}
                maxLength={500}
              />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            {state?.success && (
              <p className="text-sm text-green-600">
                Profile updated successfully.
              </p>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <p className="text-xs text-muted-foreground">
              Member since{" "}
              {new Date(initialData.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })}
            </p>
            <Button type="submit" disabled={isPending || isUploading}>
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeletingAccount}>
                {isDeletingAccount && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Your account and all associated
                  data will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    setIsDeletingAccount(true);
                    try {
                      await deleteAccount();
                    } finally {
                      setIsDeletingAccount(false);
                    }
                  }}
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
