/**
 * BaseAdminService: Generic service for Firebase Admin Firestore CRUD operations.
 * This service provides common database operations for any collection in Firestore using Admin SDK.
 * It's designed to work in server-side contexts with admin privileges.
 */

import { admin, adminDb } from "@/lib/shared/core/admin-config";


type DocumentData = admin.firestore.DocumentData;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;
type QuerySnapshot = admin.firestore.QuerySnapshot;
type Timestamp = admin.firestore.Timestamp;
type Query = admin.firestore.Query;
type CollectionReference = admin.firestore.CollectionReference;
type DocumentReference = admin.firestore.DocumentReference;

export interface BaseDocument {
  id?: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  [key: string]: any;
}

export interface PaginationOptions {
  limit?: number;
  startAfter?: DocumentSnapshot;
}

export interface QueryOptions {
  orderBy?: { field: string; direction: "asc" | "desc" }[];
  where?: {
    field: string;
    operator: admin.firestore.WhereFilterOp;
    value: any;
  }[];
  limit?: number;
  startAfter?: DocumentSnapshot;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ServiceResponse<T[]> {
  hasMore?: boolean;
  lastDoc?: DocumentSnapshot;
  total?: number;
}

export class BaseAdminService<T extends BaseDocument = BaseDocument> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Get all documents from the collection
   */
  async getAll(options?: QueryOptions): Promise<PaginatedResponse<T>> {
    try {
      let query: Query = adminDb.collection(this.collectionName);

      // Add where constraints
      if (options?.where) {
        options.where.forEach(({ field, operator, value }) => {
          query = query.where(field, operator, value);
        });
      }

      // Add orderBy constraints
      if (options?.orderBy) {
        options.orderBy.forEach(({ field, direction }) => {
          query = query.orderBy(field, direction);
        });
      } else {
        // Default ordering by createdAt desc
        query = query.orderBy("createdAt", "desc");
      }

      // Add pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.startAfter) {
        query = query.startAfter(options.startAfter);
      }

      const querySnapshot: QuerySnapshot = await query.get();

      const documents: T[] = [];
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data(),
        } as T);
      });

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore = options?.limit
        ? documents.length === options.limit
        : false;

      return {
        success: true,
        data: documents,
        hasMore,
        lastDoc,
        total: querySnapshot.size,
        message: `Successfully retrieved ${documents.length} documents`,
      };
    } catch (error) {
      console.error(
        `Error getting all documents from ${this.collectionName}:`,
        error
      );
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get documents",
        data: [],
      };
    }
  }

  /**
   * Get a document by ID
   */
  async getById(id: string): Promise<ServiceResponse<T>> {
    try {
      if (!id) {
        return {
          success: false,
          error: "Document ID is required",
        };
      }

      const docRef: DocumentReference = adminDb
        .collection(this.collectionName)
        .doc(id);
      const docSnap: DocumentSnapshot = await docRef.get();

      if (!docSnap.exists) {
        return {
          success: false,
          error: "Document not found",
        };
      }

      const document: T = {
        id: docSnap.id,
        ...docSnap.data(),
      } as T;

      return {
        success: true,
        data: document,
        message: "Document retrieved successfully",
      };
    } catch (error) {
      console.error(
        `Error getting document ${id} from ${this.collectionName}:`,
        error
      );
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get document",
      };
    }
  }

  async getByField(field: string, value: any): Promise<ServiceResponse<T>> {
    try {
      const docRef: Query = adminDb
        .collection(this.collectionName)
        .where(field, "==", value);
      const docSnap: QuerySnapshot = await docRef.get();

      if (docSnap.docs.length === 0) {
        return {
          success: false,
          error: "Document not found",
        };
      }

      const document: T = {
        id: docSnap.docs[0].id,
        ...docSnap.docs[0].data(),
      } as T;

      return {
        success: true,
        data: document,
        message: "Document retrieved successfully",
      };
    } catch (error) {
      console.error(
        `Error getting document by field ${field} in ${this.collectionName}:`,
        error
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get document by field",
      };
    }
  }

  /**
   * Create a new document
   */
  async create(
    dataInfo: Omit<T, "createdAt" | "updatedAt">
  ): Promise<ServiceResponse<T>> {
    try {
      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const documentData = {
        ...dataInfo,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      if (dataInfo.id) {
        await adminDb
          .collection(this.collectionName)
          .doc(dataInfo.id)
          .set(documentData);
        const response = await this.getById(dataInfo.id);
        return response;
      }

      const docRef: DocumentReference = await adminDb
        .collection(this.collectionName)
        .add(documentData);

      // Get the created document to return it with the generated ID
      const createdDoc = await this.getById(docRef.id);
      docRef.update({
        id: docRef.id,
      });

      if (!createdDoc.success) {
        return {
          success: false,
          error: "Document created but failed to retrieve",
        };
      }

      return {
        success: true,
        data: createdDoc.data,
        message: "Document created successfully",
      };
    } catch (error) {
      console.error(
        `Error creating document in ${this.collectionName}:`,
        error
      );
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create document",
      };
    }
  }

  /**
   * Update an existing document
   */
  async update(
    id: string,
    data: Partial<Omit<T, "id" | "createdAt">>
  ): Promise<ServiceResponse<T>> {
    try {
      if (!id) {
        return {
          success: false,
          error: "Document ID is required",
        };
      }

      // Check if document exists first
      const existingDoc = await this.getById(id);
      if (!existingDoc.success) {
        return existingDoc;
      }

      const docRef: DocumentReference = adminDb
        .collection(this.collectionName)
        .doc(id);
      const updateData = {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await docRef.update(updateData);

      // Get the updated document
      const updatedDoc = await this.getById(id);

      if (!updatedDoc.success) {
        return {
          success: false,
          error: "Document updated but failed to retrieve updated version",
        };
      }

      return {
        success: true,
        data: updatedDoc.data,
        message: "Document updated successfully",
      };
    } catch (error) {
      console.error(
        `Error updating document ${id} in ${this.collectionName}:`,
        error
      );
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update document",
      };
    }
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<ServiceResponse<void>> {
    try {
      if (!id) {
        return {
          success: false,
          error: "Document ID is required",
        };
      }

      // Check if document exists first
      const existingDoc = await this.getById(id);
      if (!existingDoc.success) {
        return {
          success: false,
          error: "Document not found",
        };
      }

      const docRef: DocumentReference = adminDb
        .collection(this.collectionName)
        .doc(id);
      await docRef.delete();

      return {
        success: true,
        message: "Document deleted successfully",
      };
    } catch (error) {
      console.error(
        `Error deleting document ${id} from ${this.collectionName}:`,
        error
      );
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete document",
      };
    }
  }

  /**
   * Check if a document exists
   */
  async exists(id: string): Promise<ServiceResponse<boolean>> {
    try {
      if (!id) {
        return {
          success: false,
          error: "Document ID is required",
        };
      }

      const docRef: DocumentReference = adminDb
        .collection(this.collectionName)
        .doc(id);
      const docSnap: DocumentSnapshot = await docRef.get();

      return {
        success: true,
        data: docSnap.exists,
        message: `Document ${docSnap.exists ? "exists" : "does not exist"}`,
      };
    } catch (error) {
      console.error(
        `Error checking document existence ${id} in ${this.collectionName}:`,
        error
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to check document existence",
      };
    }
  }

  /**
   * Count documents in the collection
   */
  async count(
    whereConditions?: {
      field: string;
      operator: admin.firestore.WhereFilterOp;
      value: any;
    }[]
  ): Promise<ServiceResponse<number>> {
    try {
      let query: Query = adminDb.collection(this.collectionName);

      if (whereConditions) {
        whereConditions.forEach(({ field, operator, value }) => {
          query = query.where(field, operator, value);
        });
      }

      const querySnapshot: QuerySnapshot = await query.get();

      return {
        success: true,
        data: querySnapshot.size,
        message: `Found ${querySnapshot.size} documents`,
      };
    } catch (error) {
      console.error(
        `Error counting documents in ${this.collectionName}:`,
        error
      );
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to count documents",
      };
    }
  }

  /**
   * Search documents by a specific field
   */
  async search(
    field: string,
    value: any,
    operator: admin.firestore.WhereFilterOp = "==",
    options?: Omit<QueryOptions, "where">
  ): Promise<PaginatedResponse<T>> {
    const searchOptions: QueryOptions = {
      ...options,
      where: [{ field, operator, value }],
    };

    return this.getAll(searchOptions);
  }

  /**
   * Get collection reference (useful for advanced queries)
   */
  getCollection(): CollectionReference {
    return adminDb.collection(this.collectionName);
  }

  /**
   * Get document reference (useful for advanced operations)
   */
  getDocRef(id: string): DocumentReference {
    return adminDb.collection(this.collectionName).doc(id);
  }
}

// Export a factory function to create service instances
export function createAdminService<T extends BaseDocument = BaseDocument>(
  collectionName: string
): BaseAdminService<T> {
  return new BaseAdminService<T>(collectionName);
}

// Export some commonly used types
export {
  admin,
  type DocumentData,
  type DocumentSnapshot,
  type QuerySnapshot,
  type Timestamp,
  type Query,
  type CollectionReference,
  type DocumentReference,
};
