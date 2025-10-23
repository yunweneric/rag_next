/**
 * BaseAdminService: Generic service for Firebase Firestore CRUD operations.
 * This service provides common database operations for any collection in Firestore.
 * It's designed to work in both client-side and server-side contexts.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  DocumentData,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/shared/core/config";

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
  where?: { field: string; operator: any; value: any }[];
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

export class BaseService<T extends BaseDocument = BaseDocument> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Get all documents from the collection
   */
  async getAll(options?: QueryOptions): Promise<PaginatedResponse<T>> {
    try {
      const constraints: QueryConstraint[] = [];

      // Add where constraints
      if (options?.where) {
        options.where.forEach(({ field, operator, value }) => {
          constraints.push(where(field, operator, value));
        });
      }

      // Add orderBy constraints
      if (options?.orderBy) {
        options.orderBy.forEach(({ field, direction }) => {
          constraints.push(orderBy(field, direction));
        });
      } else {
        // Default ordering by createdAt desc
        constraints.push(orderBy("createdAt", "desc"));
      }

      // Add pagination
      if (options?.limit) {
        constraints.push(limit(options.limit));
      }

      if (options?.startAfter) {
        constraints.push(startAfter(options.startAfter));
      }

      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot: QuerySnapshot = await getDocs(q);

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

      const docRef = doc(db, this.collectionName, id);
      const docSnap: DocumentSnapshot = await getDoc(docRef);

      if (!docSnap.exists()) {
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

  /**
   * Create a new document
   */
  async create(
    data: Omit<T, "id" | "createdAt" | "updatedAt">
  ): Promise<ServiceResponse<T>> {
    try {
      const timestamp = serverTimestamp();

      // First, create the document to get the ID
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      // Now update the document to include the ID in its data
      await updateDoc(docRef, {
        id: docRef.id,
      });

      // Return the created document with the ID
      const createdDocument: T = {
        id: docRef.id,
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp,
      } as T;

      return {
        success: true,
        data: createdDocument,
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

      const docRef = doc(db, this.collectionName, id);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);

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

      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);

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

      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      return {
        success: true,
        data: docSnap.exists(),
        message: `Document ${docSnap.exists() ? "exists" : "does not exist"}`,
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
    whereConditions?: { field: string; operator: any; value: any }[]
  ): Promise<ServiceResponse<number>> {
    try {
      const constraints: QueryConstraint[] = [];

      if (whereConditions) {
        whereConditions.forEach(({ field, operator, value }) => {
          constraints.push(where(field, operator, value));
        });
      }

      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

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
   * Get paginated documents with offset-based pagination
   */
  async getPaginated(
    page: number = 1,
    pageSize: number = 10,
    options?: Omit<QueryOptions, "limit" | "startAfter">
  ): Promise<
    PaginatedResponse<T> & {
      totalCount?: number;
      currentPage?: number;
      totalPages?: number;
    }
  > {
    try {
      // Get all documents matching the query (for accurate pagination)
      const allDocsResult = await this.getAll({
        ...options,
        orderBy: options?.orderBy || [
          { field: "createdAt", direction: "desc" },
        ],
      });

      if (!allDocsResult.success || !allDocsResult.data) {
        return {
          success: false,
          error: allDocsResult.error || "Failed to fetch documents",
          data: [],
        };
      }

      const allDocs = allDocsResult.data;
      const totalCount = allDocs.length;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Calculate the slice for this page
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, totalCount);
      const actualItemsNeeded = endIndex - startIndex;

      // Get only the documents for this page
      const paginatedDocs = allDocs.slice(startIndex, endIndex);
      const hasMore = page < totalPages;

      console.log(
        `[BaseService.getPaginated] Collection: ${this.collectionName}, Page ${page}:`,
        {
          totalCount,
          totalPages,
          startIndex,
          endIndex,
          actualItemsNeeded,
          returnedItems: paginatedDocs.length,
          pageSize,
          page,
        }
      );

      return {
        success: true,
        data: paginatedDocs,
        hasMore,
        total: paginatedDocs.length,
        totalCount,
        currentPage: page,
        totalPages,
        message: `Successfully retrieved page ${page} of ${totalPages}`,
      };
    } catch (error) {
      console.error(
        `Error getting paginated documents from ${this.collectionName}:`,
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
   * Search documents by a specific field
   */
  async search(
    field: string,
    value: any,
    operator: any = "==",
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
  getCollection() {
    return collection(db, this.collectionName);
  }

  /**
   * Get document reference (useful for advanced operations)
   */
  getDocRef(id: string) {
    return doc(db, this.collectionName, id);
  }
}

// Export a factory function to create service instances
export function createService<T extends BaseDocument = BaseDocument>(
  collectionName: string
): BaseService<T> {
  return new BaseService<T>(collectionName);
}

// Export some commonly used types
export {
  Timestamp,
  serverTimestamp,
  type DocumentData,
  type DocumentSnapshot,
  type QuerySnapshot,
};

// Export pagination response type
export type PaginatedResponseWithMeta<T> = PaginatedResponse<T> & {
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
};
