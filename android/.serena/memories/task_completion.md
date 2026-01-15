# Task Completion Checklist

Before finalizing any task, ensure the following steps are performed:

1. **Linting**: Run `npm run lint` in the root directory to ensure code quality.
2. **Testing**: Run `npm run test` in the root directory to verify that no regressions were introduced.
3. **Type Checking**: Ensure `npm run build` (which includes `tsc`) passes without errors.
4. **Android Build**: If changes affect the native part, run `./gradlew assembleDebug` in the `android/` directory.
5. **Capacitor Sync**: If web assets changed and need to be reflected in Android, run `npm run mobile:sync` in the root directory.
