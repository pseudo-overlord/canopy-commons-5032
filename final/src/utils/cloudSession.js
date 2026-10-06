export function createCloudSession({
  auth,
  signIn,
  signOut,
  publish,
  claims,
  recoverProfile,
}) {
  let operation = 0,
    observation = 0,
    pending = false,
    ended = false;
  const account = (user, token) => ({
    uid: user.uid,
    email: user.email,
    name: user.displayName || "Volunteer",
    emailVerified: user.emailVerified,
    role: token.claims.canopyCoordinator === true ? "coordinator" : "volunteer",
  });
  return {
    async observe(user) {
      const version = ++observation,
        intent = operation;
      if (!user) {
        publish(null);
        return;
      }
      if (pending || ended) return;
      const token = await claims(user, false);
      if (
        version === observation &&
        intent === operation &&
        !ended &&
        !pending &&
        auth.currentUser?.uid === user.uid
      )
        publish(account(user, token));
    },
    async login(email, password) {
      const intent = ++operation;
      pending = true;
      ended = false;
      try {
        const { user } = await signIn(email, password);
        if (intent !== operation) {
          if (ended) await signOut();
          throw new Error("Sign-in was cancelled. Please try again.");
        }
        const token = await claims(user, true);
        await recoverProfile(user);
        if (intent !== operation || auth.currentUser?.uid !== user.uid)
          throw new Error("Sign-in changed. Please try again.");
        publish(account(user, token));
      } catch (failure) {
        if (intent === operation) {
          ended = true;
          publish(null);
          await signOut();
        }
        throw failure;
      } finally {
        if (intent === operation) pending = false;
      }
    },
    async logout() {
      operation++;
      observation++;
      ended = true;
      pending = false;
      publish(null);
      await signOut();
    },
  };
}
