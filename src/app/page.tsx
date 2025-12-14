import PostCreator from "@/components/PostCreator";
import { getPosts, getUsers } from "./actions";
import UserList from "@/components/UserList";
import PostList from "@/components/PostList";

export default async function Home() {
  const users = await getUsers();
  const posts = await getPosts(20);
  return (
    <div className="flex min-h-screen py-12  pt-20 px-6 w-full">
      <div className="flex flex-col w-full">
        <div className="flex flex-col items-end w-full">
          <PostCreator />
        </div>
        <UserList initialUsers={users} />
        <PostList initialPosts={posts} />
      </div>
    </div>
  );
}
